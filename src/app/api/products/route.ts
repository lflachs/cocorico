import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

/**
 * GET /api/products
 * Get all products from inventory
 */
export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        unit: true,
        quantity: true,
        unitPrice: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
