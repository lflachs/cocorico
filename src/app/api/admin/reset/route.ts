import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or staging
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      return NextResponse.json(
        { error: 'Reset is not allowed in production environment' },
        { status: 403 }
      );
    }

    // Get current session and restaurant
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get selected restaurant from cookie
    const cookieStore = await cookies();
    const restaurantId = cookieStore.get('selectedRestaurantId')?.value;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'No restaurant selected. Please select a restaurant first.' },
        { status: 400 }
      );
    }

    // Clean up data for current restaurant only (in reverse order of dependencies)
    await db.sale.deleteMany({ where: { restaurantId } });
    await db.production.deleteMany({ where: { restaurantId } });
    await db.byproduct.deleteMany({ where: { restaurantId } });
    await db.byproductSuggestion.deleteMany({ where: { restaurantId } });
    await db.dailyMenuConfig.deleteMany({ where: { restaurantId } });
    await db.dLC.deleteMany({ where: { restaurantId } });
    await db.menuDish.deleteMany({ where: { section: { restaurantId } } });
    await db.menuSection.deleteMany({ where: { restaurantId } });
    await db.menu.deleteMany({ where: { restaurantId } });
    await db.recipeIngredient.deleteMany({ where: { dish: { restaurantId } } });
    await db.dish.deleteMany({ where: { restaurantId } });
    await db.dishFolder.deleteMany({ where: { restaurantId } });
    await db.recipeCategory.deleteMany({ where: { restaurantId } });
    await db.stockMovement.deleteMany({ where: { product: { restaurantId } } });
    await db.billProduct.deleteMany({ where: { bill: { restaurantId } } });
    await db.disputeProduct.deleteMany({ where: { dispute: { restaurantId } } });
    await db.dispute.deleteMany({ where: { restaurantId } });
    await db.priceHistory.deleteMany({ where: { restaurantId } });
    await db.bill.deleteMany({ where: { restaurantId } });
    await db.compositeIngredient.deleteMany({ where: { compositeProduct: { restaurantId } } });
    await db.product.deleteMany({ where: { restaurantId } });
    await db.supplier.deleteMany({ where: { restaurantId } });

    // Get restaurant name for response
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true },
    });

    return NextResponse.json({
      success: true,
      message: `Database reset successfully for "${restaurant?.name}". All restaurant data has been deleted.`,
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset database',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
