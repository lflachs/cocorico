import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

/**
 * POST /api/products/[id]/sync-adjust
 * Update product quantity during inventory sync and track the movement
 * This creates a stock movement record for analytics and waste tracking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newQuantity, lossReason } = body;

    if (newQuantity === undefined || newQuantity === null) {
      return NextResponse.json(
        { error: 'newQuantity is required' },
        { status: 400 }
      );
    }

    // Round quantity to 2 decimal places to avoid floating point precision errors
    const roundedQuantity = Math.round(newQuantity * 100) / 100;

    // Get current product state
    const currentProduct = await db.product.findUnique({
      where: { id },
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const oldQuantity = currentProduct.quantity;
    const difference = roundedQuantity - oldQuantity;

    // Even if no quantity change, mark as verified
    if (difference === 0) {
      const updatedProduct = await db.product.update({
        where: { id },
        data: {
          lastVerifiedAt: new Date(), // Mark as verified even without quantity change
        },
      });

      return NextResponse.json({
        product: updatedProduct,
        movement: null,
        message: 'No change in quantity, but marked as verified',
      });
    }

    // Determine movement type based on difference
    const movementType = difference > 0 ? 'IN' : 'OUT';
    const absoluteDifference = Math.abs(difference);

    // Use Prisma transaction to update product and create movement atomically
    const result = await db.$transaction(async (tx) => {
      // Update product with verification timestamp
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          quantity: roundedQuantity,
          totalValue: currentProduct.unitPrice
            ? roundedQuantity * currentProduct.unitPrice
            : null,
          lastVerifiedAt: new Date(), // Mark as verified during sync
        },
      });

      // Create stock movement record
      const stockMovement = await tx.stockMovement.create({
        data: {
          productId: id,
          movementType: 'ADJUSTMENT',
          quantity: absoluteDifference,
          balanceAfter: roundedQuantity,
          reason: 'Inventory Sync Adjustment',
          description: difference > 0
            ? `Stock increased by ${absoluteDifference.toFixed(2)} ${currentProduct.unit} during inventory sync (was ${oldQuantity.toFixed(2)}, now ${roundedQuantity.toFixed(2)})`
            : `Stock decreased by ${absoluteDifference.toFixed(2)} ${currentProduct.unit} during inventory sync (was ${oldQuantity.toFixed(2)}, now ${roundedQuantity.toFixed(2)})`,
          source: 'MANUAL', // Sync is a manual verification process
          unitPrice: currentProduct.unitPrice,
          totalValue: currentProduct.unitPrice
            ? absoluteDifference * currentProduct.unitPrice
            : null,
          lossReason: difference < 0 && lossReason ? lossReason : null, // Only set for losses
        },
      });

      return { product: updatedProduct, movement: stockMovement };
    });

    return NextResponse.json({
      success: true,
      product: result.product,
      movement: result.movement,
      difference: {
        oldQuantity,
        newQuantity: roundedQuantity,
        change: difference,
        type: difference > 0 ? 'addition' : 'loss',
      },
    });
  } catch (error) {
    console.error('Error adjusting product quantity:', error);
    return NextResponse.json(
      {
        error: 'Failed to adjust product quantity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
