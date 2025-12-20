import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Clear all auth-related cookies
    cookieStore.delete('selectedRestaurantId');
    cookieStore.delete('authjs.session-token');
    cookieStore.delete('__Secure-authjs.session-token');
    cookieStore.delete('authjs.callback-url');
    cookieStore.delete('__Secure-authjs.callback-url');
    cookieStore.delete('authjs.csrf-token');
    cookieStore.delete('__Secure-authjs.csrf-token');

    return NextResponse.json({
      success: true,
      message: 'All cookies cleared. Please refresh the page.',
    });
  } catch (error: any) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cookies',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
