import { NextRequest, NextResponse } from 'next/server';
import { getAllBills } from '@/lib/services/bill.service';

/**
 * GET /api/bills
 * Get all bills
 */
export async function GET(request: NextRequest) {
  try {
    const bills = await getAllBills();

    // Transform the data for the frontend
    const transformedBills = bills.map((bill) => ({
      id: bill.id,
      filename: bill.filename,
      supplier: bill.supplier,
      billDate: bill.billDate,
      totalAmount: bill.totalAmount,
      itemCount: bill.products.length,
      createdAt: bill.createdAt,
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
