"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  RegisterSchema,
  LoginSchema,
  type RegisterInput,
  type LoginInput,
} from "@/lib/validations/auth";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Register new user
 */
export async function registerUser(input: RegisterInput): Promise<AuthActionResult> {
  const validation = RegisterSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid registration data.",
    };
  }

  const { name, email, password } = validation.data;

  // Rate limiting: max 10 registration attempts per minute per email
  const rateLimit = checkRateLimit(`register:${email.toLowerCase()}`, 10, 60 * 1000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: `Too many registration attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during registration. Please try again.",
    };
  }
}

/**
 * Server Action: Login user
 */
export async function loginUser(input: LoginInput): Promise<AuthActionResult> {
  const validation = LoginSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid login data.",
    };
  }

  const { email, password } = validation.data;

  // Rate limiting: max 8 login attempts per minute per email
  const rateLimit = checkRateLimit(`login:${email.toLowerCase()}`, 8, 60 * 1000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: `Too many login attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    await createSession(user.id, user.email, user.name);

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during login. Please try again.",
    };
  }
}

/**
 * Server Action: Logout user
 */
export async function logoutUser(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
