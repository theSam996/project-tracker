import { describe, it, expect } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/session";

describe("JWT Session Token Management", () => {
  it("should sign and successfully verify a session payload", async () => {
    const payload = {
      userId: "user-cuid-12345",
      email: "test@example.com",
      name: "Test User",
    };

    const token = await signSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.name).toBe(payload.name);
  });

  it("should return null for malformed or tampered token", async () => {
    const tamperedToken = "invalid.token.payload";
    const verified = await verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });
});
