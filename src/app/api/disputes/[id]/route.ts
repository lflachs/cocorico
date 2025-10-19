import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute, deleteDispute } from '@/lib/services/dispute.service';
import type { DisputeStatus } from '@prisma/client';

/**
 * GET /api/disputes/[id]
 * Get dispute by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dispute = await getDisputeById(params.id);

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dispute',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/disputes/[id]
 * Update dispute status or resolution notes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, resolutionNotes } = body;

    const dispute = await updateDispute(params.id, {
      status: status as DisputeStatus | undefined,
      resolutionNotes,
    });

    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      {
        error: 'Failed to update dispute',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/disputes/[id]
 * Delete a dispute
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteDispute(params.id);

    return NextResponse.json({
      success: true,
      message: 'Dispute deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting dispute:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete dispute',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
