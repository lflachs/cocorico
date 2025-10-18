import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

/**
 * GET /api/disputes
 * Fetch disputes with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const disputes = await db.dispute.findMany({
      where: status ? { status: status.toUpperCase() as any } : undefined,
      include: {
        bill: {
          select: {
            supplier: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(disputes);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}
