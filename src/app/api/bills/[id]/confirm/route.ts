import { NextRequest, NextResponse } from 'next/server';
import { confirmBill } from '@/lib/services/bill.service';
import { db } from '@/lib/db/client';

/**
 * POST /api/bills/[id]/confirm
 * Confirm bill and update inventory
 * Creates new products if they don't exist
 */

type ProductMapping = {
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { products, supplier, billDate, totalAmount } = body as {
      products: ProductMapping[];
      supplier?: string;
      billDate?: string;
      totalAmount?: number;
    };

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }

    // Process each product - create if needed, then confirm
    const processedProducts = [];

    for (const product of products) {
      let productId = product.productId;

      // If no productId, create a new product
      if (!productId) {
        const newProduct = await db.product.create({
          data: {
            name: product.productName,
            quantity: 0, // Will be updated by confirmBill
            unit: product.unit.toUpperCase() as 'KG' | 'L' | 'PC',
            unitPrice: product.unitPrice,
            totalValue: 0,
            trackable: true,
          },
        });
        productId = newProduct.id;
      }

      processedProducts.push({
        productId,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
      });
    }

    // Update bill with supplier, date, and total amount
    await db.bill.update({
      where: { id: params.id },
      data: {
        supplier: supplier,
        billDate: billDate ? new Date(billDate) : null,
        totalAmount: totalAmount,
      },
    });

    // Confirm bill and update stock
    await confirmBill(params.id, processedProducts);

    return NextResponse.json({
      success: true,
      message: 'Bill confirmed and inventory updated',
    });
  } catch (error) {
    console.error('Error confirming bill:', error);
    return NextResponse.json(
      {
        error: 'Failed to confirm bill',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
