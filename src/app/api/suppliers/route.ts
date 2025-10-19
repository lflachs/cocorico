import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

/**
 * GET /api/suppliers
 * Get all suppliers
 */
export async function GET(request: NextRequest) {
  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch suppliers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contactName, email, phone, address, notes, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      );
    }

    const supplier = await db.supplier.create({
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

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A supplier with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create supplier',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
