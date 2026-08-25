import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SECRET_KEY = process.env.AUTH_SECRET || "fallback-secret-key-at-least-32-characters-long-12345";
const key = new TextEncoder().encode(SECRET_KEY);

const SESSION_COOKIE_NAME = "session";
const SESSION_EXPIRATION_TIME = "7d";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  name: string | null;
  [key: string]: unknown;
}

/**
 * Sign a JWT session token with Web Crypto (Edge & Node compatible)
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION_TIME)
    .sign(key);
}

/**
 * Verify a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Create a session and set HTTP-only cookie
 */
export async function createSession(userId: string, email: string, name: string | null): Promise<void> {
  const token = await signSessionToken({ userId, email, name });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Retrieve the current session payload from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Destroy the session and clear cookie
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Fetch the authenticated user record from the database (excluding password)
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}
