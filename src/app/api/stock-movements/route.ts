import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get current restaurant
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const restaurantId = cookieStore.get('selectedRestaurantId')?.value;

    if (!restaurantId) {
      return NextResponse.json({ error: 'No restaurant selected' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const movements = await db.stockMovement.findMany({
      where: {
        product: {
          restaurantId,
        },
      },
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

    console.log(`[stock-movements] restaurantId=${restaurantId}, found ${movements.length} movements`);

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}
