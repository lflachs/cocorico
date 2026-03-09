"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db/client";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signup(formData: FormData) {
  try {
    const validatedFields = signupSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0].message,
      };
    }

    const { name, email, password } = validatedFields.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        error: "An account with this email already exists",
      };
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
      },
    });

    // Sign in the user
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}

export async function signin(formData: FormData) {
  try {
    const validatedFields = signinSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0].message,
      };
    }

    const { email, password } = validatedFields.data;

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/today",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error;
  }
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/today" });
}

export async function logout() {
  // Clear restaurant selection cookie
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("selectedRestaurantId");

  await signOut({ redirectTo: "/login" });
}
