import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Restaurant selection doesn't require restaurant context
  const restaurantSelectionRoute = pathname === "/select-restaurant";

  // API routes and static files should be accessible
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if authenticated and trying to access auth pages
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/select-restaurant", req.url));
  }

  // For authenticated users, check if they have selected a restaurant
  if (isAuthenticated && !isPublicRoute && !restaurantSelectionRoute) {
    const selectedRestaurantId = req.cookies.get("selectedRestaurantId")?.value;

    // If no restaurant selected, redirect to selection page
    if (!selectedRestaurantId) {
      return NextResponse.redirect(new URL("/select-restaurant", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
