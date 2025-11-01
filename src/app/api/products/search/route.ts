import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/services/product.service';

/**
 * GET /api/products/search
 * Search for products by name
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }

    const products = await searchProducts(query.trim());

    return NextResponse.json({
      success: true,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })),
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      {
        error: 'Failed to search products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
