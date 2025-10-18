import { NextRequest, NextResponse } from 'next/server';
import { deleteCompositeProduct } from '@/lib/services/product.service';

/**
 * DELETE /api/composite-products/[id]
 * Delete a composite product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await deleteCompositeProduct(id);

    console.log('[API] Deleted composite product:', id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting composite product:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete composite product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
