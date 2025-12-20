import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or staging
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seeding is not allowed in production environment' },
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

    // Run the seed script with restaurant ID and user ID
    const { stdout, stderr } = await execAsync(
      `SEED_RESTAURANT_ID=${restaurantId} SEED_USER_ID=${session.user.id} npm run db:seed`
    );

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      output: stdout,
      errors: stderr || null,
    });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed database',
        details: error.message,
        output: error.stdout,
        stderr: error.stderr,
      },
      { status: 500 }
    );
  }
}
