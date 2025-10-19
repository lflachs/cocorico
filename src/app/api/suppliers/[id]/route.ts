import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

/**
 * PUT /api/suppliers/[id]
 * Update a supplier
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, contactName, email, phone, address, notes, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      );
    }

    const supplier = await db.supplier.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A supplier with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update supplier',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Delete a supplier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if supplier has any bills
    const billsCount = await db.bill.count({
      where: { supplierId: params.id },
    });

    if (billsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete supplier with ${billsCount} associated bill(s)` },
        { status: 400 }
      );
    }

    await db.supplier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete supplier',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
