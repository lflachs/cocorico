import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { createSale } from '@/lib/services/sale.service';

/**
 * POST /api/sales/[id]/confirm
 * Confirm sales and deduct stock based on recipes (with smart detection)
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: receiptId } = await params;
    const body = await request.json();
    const { saleDate, totalAmount, dishes } = body;

    console.log('Confirming sales:', { receiptId, saleDate, totalAmount, dishes });

    // Validate input
    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      return NextResponse.json({ error: 'No dishes provided' }, { status: 400 });
    }

    const results = [];

    // Process each dish using the smart detection service
    for (const dishInput of dishes) {
      const { name, quantity, dishId } = dishInput;

      // Use dishId if provided (from DishConfirmCard matching), otherwise search by name
      let dish = dishId
        ? await db.dish.findUnique({ where: { id: dishId } })
        : await db.dish.findFirst({
            where: {
              name: {
                equals: name,
                mode: 'insensitive',
              },
            },
          });

      // If dish doesn't exist, create placeholder
      if (!dish) {
        console.log(`Dish not found: ${name}, creating placeholder`);
        dish = await db.dish.create({
          data: {
            name: name,
            isActive: true,
          },
        });
      }

      try {
        // Use the smart detection service - it handles prepared vs raw ingredients
        await createSale({
          dishId: dish.id,
          quantitySold: quantity,
          saleDate: saleDate ? new Date(saleDate) : new Date(),
          notes: `Imported from receipt scan - ${receiptId}`,
        });

        results.push({
          dishName: dish.name,
          quantitySold: quantity,
          success: true,
        });
      } catch (error) {
        console.error(`Error recording sale for ${dish.name}:`, error);
        results.push({
          dishName: dish.name,
          quantitySold: quantity,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${dishes.length} sales recorded`,
      results,
    });
  } catch (error) {
    console.error('Error confirming sales:', error);
    return NextResponse.json(
      {
        error: 'Failed to confirm sales',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
