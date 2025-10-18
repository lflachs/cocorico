import { NextRequest, NextResponse } from 'next/server';
import { createCompositeProduct } from '@/lib/services/product.service';
import { compositeProductSchema } from '@/lib/validations/product.schema';
import { getCompositeProducts } from '@/lib/queries/product.queries';

/**
 * GET /api/composite-products
 * Get all composite products with their ingredients
 */
export async function GET() {
  try {
    const compositeProducts = await getCompositeProducts();
    return NextResponse.json(compositeProducts);
  } catch (error) {
    console.error('Error fetching composite products:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch composite products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/composite-products
 * Create a new composite product with ingredients
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = compositeProductSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const compositeProduct = await createCompositeProduct(validationResult.data);

    console.log('[API] Created composite product:', compositeProduct.name);

    return NextResponse.json(compositeProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating composite product:', error);
    return NextResponse.json(
      {
        error: 'Failed to create composite product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
