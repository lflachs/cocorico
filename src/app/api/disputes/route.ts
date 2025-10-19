import { NextRequest, NextResponse } from 'next/server';
import { getAllDisputes, getOpenDisputes, createDispute } from '@/lib/services/dispute.service';
import type { DisputeType } from '@prisma/client';

/**
 * GET /api/disputes
 * Fetch disputes with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterParam = searchParams.get('filter');

    let disputes;
    if (filterParam === 'open') {
      disputes = await getOpenDisputes();
    } else {
      disputes = await getAllDisputes();
    }

    return NextResponse.json(disputes);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

/**
 * POST /api/disputes
 * Create a new dispute
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billId, type, title, description, amountDisputed, products } = body;

    if (!billId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: billId, type, title' },
        { status: 400 }
      );
    }

    const dispute = await createDispute({
      billId,
      type: type as DisputeType,
      title,
      description,
      amountDisputed: amountDisputed ? parseFloat(amountDisputed) : undefined,
      products,
    });

    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      {
        error: 'Failed to create dispute',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
