import { NextRequest, NextResponse } from 'next/server';
import { resolveDispute } from '@/lib/services/dispute.service';

/**
 * POST /api/disputes/[id]/resolve
 * Resolve a dispute and process returns
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { resolutionNotes, productReturns } = body;

    if (!resolutionNotes) {
      return NextResponse.json(
        { error: 'Resolution notes are required' },
        { status: 400 }
      );
    }

    await resolveDispute(params.id, resolutionNotes, productReturns);

    return NextResponse.json({
      success: true,
      message: 'Dispute resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      {
        error: 'Failed to resolve dispute',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
