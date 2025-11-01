import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const movements = await db.stockMovement.findMany({
      take: limit,
      orderBy: {
        movementDate: 'desc',
      },
      include: {
        product: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}
