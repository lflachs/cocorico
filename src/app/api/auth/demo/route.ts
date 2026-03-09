import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { hash } from "bcryptjs";
import { exec } from "child_process";
import { promisify } from "util";
import { cookies } from "next/headers";

const execAsync = promisify(exec);

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@cocorico.app";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "demo-cocorico-2024";

export async function POST() {
  try {
    // Find or create demo user
    let user = await db.user.findUnique({
      where: { email: DEMO_EMAIL },
    });

    if (!user) {
      const passwordHash = await hash(DEMO_PASSWORD, 12);
      user = await db.user.create({
        data: {
          email: DEMO_EMAIL,
          name: "Utilisateur Demo",
          passwordHash,
          role: "USER",
        },
      });
    }

    // Find or create demo restaurant
    let restaurant = await db.restaurant.findUnique({
      where: { slug: "le-bistrot-demo" },
    });

    let needsSeed = false;

    if (!restaurant) {
      restaurant = await db.restaurant.create({
        data: {
          name: "Le Bistrot Demo",
          slug: "le-bistrot-demo",
          description: "Restaurant de démonstration avec des données pré-remplies",
        },
      });
      needsSeed = true;
    } else {
      // Check if restaurant has enough data (seed creates 30+ products)
      // If partially seeded, re-seed to fix incomplete data
      const productCount = await db.product.count({
        where: { restaurantId: restaurant.id },
      });
      needsSeed = productCount < 20;
    }

    // Ensure user is linked to the restaurant
    const existingLink = await db.userRestaurant.findFirst({
      where: {
        userId: user.id,
        restaurantId: restaurant.id,
      },
    });

    if (!existingLink) {
      await db.userRestaurant.create({
        data: {
          userId: user.id,
          restaurantId: restaurant.id,
          role: "OWNER",
        },
      });
    }

    // Seed demo data if needed (reuses the existing seed script)
    if (needsSeed) {
      await execAsync(
        `SEED_RESTAURANT_ID=${restaurant.id} SEED_USER_ID=${user.id} npm run db:seed`
      );
    }

    // Set the restaurant cookie so the demo user lands in the right restaurant
    const cookieStore = await cookies();
    cookieStore.set("selectedRestaurantId", restaurant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    // Return credentials for client-side signIn
    return NextResponse.json({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  } catch (error) {
    console.error("Demo setup error:", error);
    return NextResponse.json(
      { error: "Impossible de configurer le compte démo" },
      { status: 500 }
    );
  }
}
