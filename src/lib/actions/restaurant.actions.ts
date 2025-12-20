"use server";

import { db } from "@/lib/db/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";

const createRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().optional(),
});

export async function getSelectedRestaurantId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const selectedRestaurantId = cookieStore.get("selectedRestaurantId")?.value;

  if (selectedRestaurantId) {
    // Verify user has access to this restaurant
    const userRestaurant = await db.userRestaurant.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: selectedRestaurantId,
      },
    });

    if (userRestaurant) {
      return selectedRestaurantId;
    }
  }

  // If no valid selection, return first restaurant user has access to
  const firstRestaurant = await db.userRestaurant.findFirst({
    where: {
      userId: session.user.id,
    },
    select: {
      restaurantId: true,
    },
  });

  return firstRestaurant?.restaurantId || null;
}

export async function getUserRestaurants() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const userRestaurants = await db.userRestaurant.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      restaurant: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return userRestaurants.map((ur) => ({
    ...ur.restaurant,
    role: ur.role,
  }));
}

export async function createRestaurant(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedFields = createRestaurantSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0].message,
      };
    }

    const { name, description } = validatedFields.data;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingRestaurant = await db.restaurant.findUnique({
      where: { slug },
    });

    let finalSlug = slug;
    if (existingRestaurant) {
      // Add random suffix if slug exists
      finalSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Create restaurant and associate user as OWNER
    const restaurant = await db.restaurant.create({
      data: {
        name,
        slug: finalSlug,
        description,
        users: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Set as selected restaurant
    const cookieStore = await cookies();
    cookieStore.set("selectedRestaurantId", restaurant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return { success: true, restaurant };
  } catch (error) {
    console.error("Create restaurant error:", error);
    return {
      error: "Failed to create restaurant. Please try again.",
    };
  }
}

export async function selectRestaurant(restaurantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  // Verify user has access to this restaurant
  const userRestaurant = await db.userRestaurant.findFirst({
    where: {
      userId: session.user.id,
      restaurantId,
    },
  });

  if (!userRestaurant) {
    return { error: "You don't have access to this restaurant" };
  }

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set("selectedRestaurantId", restaurantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return { success: true };
}

export async function getCurrentRestaurant() {
  const restaurantId = await getSelectedRestaurantId();
  if (!restaurantId) return null;

  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
  });

  return restaurant;
}
