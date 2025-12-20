import { NextRequest, NextResponse } from 'next/server';
import { getAllBills } from '@/lib/services/bill.service';
import { getSelectedRestaurantId } from '@/lib/actions/restaurant.actions';

/**
 * GET /api/bills
 * Get all bills
 */
export async function GET(request: NextRequest) {
  try {
    // Get current restaurant
    const restaurantId = await getSelectedRestaurantId();
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'No restaurant selected' },
        { status: 403 }
      );
    }

    const bills = await getAllBills(restaurantId);

    // Transform the data for the frontend
    const transformedBills = bills.map((bill) => ({
      id: bill.id,
      filename: bill.filename,
      supplier: bill.supplier ? { name: bill.supplier.name } : null,
      billDate: bill.billDate,
      totalAmount: bill.totalAmount,
      itemCount: bill.products.length,
      createdAt: bill.createdAt,
      status: bill.status,
    }));

    return NextResponse.json(transformedBills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bills',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
