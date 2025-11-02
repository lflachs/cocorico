import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

/**
 * GET /api/price-history
 * Get all price history records with product, bill, and supplier information
 */
export async function GET() {
  try {
    const priceHistory = await db.priceHistory.findMany({
      orderBy: {
        changedAt: 'desc',
      },
      include: {
        product: {
          select: {
            name: true,
            displayName: true,
            unit: true,
          },
        },
        bill: {
          select: {
            filename: true,
            billDate: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(priceHistory);
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch price history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
