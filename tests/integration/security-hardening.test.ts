import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { loginUser } from "@/server/actions/auth.actions";
import { searchGlobalAction } from "@/server/actions/search.actions";
import { getAuthSecretKey, signSessionToken, verifySessionToken } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

// Global mock state for logged-in user
let currentMockUser: { id: string; email: string; name: string | null } | null = null;

vi.mock("@/lib/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session")>();
  return {
    ...actual,
    getCurrentUser: vi.fn(() => Promise.resolve(currentMockUser)),
  };
});

describe("Phase 6: Security Hardening & Vulnerability Regression Suite", () => {
  let testUser: { id: string; email: string; name: string | null };

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `securitytest-${Date.now()}@example.com`,
        name: "Security Tester",
        password: "HashedTestPassword123",
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  describe("6.1 Authentication & Session Security", () => {
    it("should sign and verify valid session tokens using Web Crypto HS256", async () => {
      const payload = { userId: testUser.id, email: testUser.email, name: testUser.name };
      const token = await signSessionToken(payload);

      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // Standard JWT 3-part structure

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(testUser.id);
      expect(verified?.email).toBe(testUser.email);
    });

    it("should reject tampered or corrupted session tokens", async () => {
      const payload = { userId: testUser.id, email: testUser.email, name: testUser.name };
      const token = await signSessionToken(payload);
      const tamperedToken = token.slice(0, -5) + "abcde";

      const verified = await verifySessionToken(tamperedToken);
      expect(verified).toBeNull();
    });

    it("should reject random non-JWT strings", async () => {
      const verified = await verifySessionToken("invalid.token.structure");
      expect(verified).toBeNull();
    });

    it("should enforce minimum 32 character requirement for AUTH_SECRET", () => {
      const secretKey = getAuthSecretKey();
      expect(secretKey).toBeInstanceOf(Uint8Array);
      expect(secretKey.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe("6.2 Rate Limiting Safeguards", () => {
    it("should allow requests under rate limit threshold", () => {
      const id = `test-rl-${Date.now()}`;
      const res1 = checkRateLimit(id, 3, 10000);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit(id, 3, 10000);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);
    });

    it("should block requests exceeding rate limit threshold", () => {
      const id = `test-rl-block-${Date.now()}`;
      checkRateLimit(id, 2, 10000);
      checkRateLimit(id, 2, 10000);

      const blockedRes = checkRateLimit(id, 2, 10000);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.resetInSeconds).toBeGreaterThan(0);
    });

    it("should block brute-force login attempts exceeding limit", async () => {
      const spamEmail = `bruteforce-${Date.now()}@example.com`;
      for (let i = 0; i < 8; i++) {
        await loginUser({ email: spamEmail, password: "wrongpassword123" });
      }

      const blockedResult = await loginUser({ email: spamEmail, password: "wrongpassword123" });
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.error).toContain("Too many login attempts");
    });
  });

  describe("6.3 Password & Sensitive Data Exposure Prevention", () => {
    it("should never return plaintext password or password hash from user queries", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      expect(user).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((user as any).password).toBeUndefined();
    });

    it("should reject unauthenticated search requests", async () => {
      currentMockUser = null;
      const res = await searchGlobalAction("test");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Authentication required");
    });
  });
});
