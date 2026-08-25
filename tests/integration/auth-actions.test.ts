import { describe, it, expect, afterAll } from "vitest";
import { registerUser, loginUser } from "@/server/actions/auth.actions";
import { prisma } from "@/lib/prisma";

describe("Authentication Server Actions Integration", () => {
  const testUser = {
    name: "Integration Test User",
    email: `test-${Date.now()}@example.com`,
    password: "Password123",
    confirmPassword: "Password123",
  };

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  it("should successfully register a new user", async () => {
    const result = await registerUser(testUser);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // Verify user in database
    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.name).toBe(testUser.name);
    expect(dbUser?.password).not.toBe(testUser.password); // Password must be hashed
  });

  it("should reject duplicate email registration", async () => {
    const result = await registerUser(testUser);
    expect(result.success).toBe(false);
    expect(result.error).toBe("An account with this email already exists.");
  });

  it("should reject invalid login credentials (wrong password)", async () => {
    const result = await loginUser({
      email: testUser.email,
      password: "WrongPassword123",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password.");
  });

  it("should reject non-existent user login", async () => {
    const result = await loginUser({
      email: "nonexistent@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password.");
  });
});
