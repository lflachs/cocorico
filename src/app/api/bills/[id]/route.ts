import { NextRequest, NextResponse } from 'next/server';
import { getBillById } from '@/lib/services/bill.service';
import { db } from '@/lib/db/client';
import { getSelectedRestaurantId } from '@/lib/actions/restaurant.actions';

/**
 * GET /api/bills/[id]
 * Get bill details by ID
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current restaurant
    const restaurantId = await getSelectedRestaurantId();
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'No restaurant selected' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const bill = await getBillById(id, restaurantId);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Parse raw content to get extracted items
    let extractedProducts = [];
    if (bill.rawContent) {
      try {
        const ocrResult = JSON.parse(bill.rawContent);
        extractedProducts = ocrResult.items?.map((item: any, index: number) => ({
          id: `item-${index}`,
          name: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })) || [];
      } catch (e) {
        console.error('Error parsing bill raw content:', e);
      }
    }

    return NextResponse.json({
      id: bill.id,
      supplierName: bill.supplier?.name || 'Unknown Supplier',
      date: bill.billDate || bill.createdAt,
      totalAmount: bill.totalAmount || 0,
      extractedProducts,
      status: bill.status,
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bill',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bills/[id]
 * Delete a bill by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current restaurant
    const restaurantId = await getSelectedRestaurantId();
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'No restaurant selected' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify bill belongs to restaurant before deleting
    const bill = await db.bill.findUnique({
      where: { id },
      select: { restaurantId: true },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    if (bill.restaurantId !== restaurantId) {
      return NextResponse.json(
        { error: 'Unauthorized: Bill belongs to another restaurant' },
        { status: 403 }
      );
    }

    // Delete the bill (cascade will delete related records)
    await db.bill.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Bill deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete bill',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
