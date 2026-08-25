import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

describe("Password Hashing & Verification", () => {
  it("should securely hash a password and verify matching plain text", async () => {
    const plainPassword = "SecurePassword123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    expect(hashedPassword).not.toBe(plainPassword);
    expect(hashedPassword.startsWith("$2")).toBe(true);

    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    expect(isValid).toBe(true);
  });

  it("should reject an incorrect password against hash", async () => {
    const plainPassword = "SecurePassword123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const isInvalid = await bcrypt.compare("WrongPassword123", hashedPassword);
    expect(isInvalid).toBe(false);
  });
});
