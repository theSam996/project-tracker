import { describe, it, expect } from "vitest";
import { RegisterSchema, LoginSchema } from "@/lib/validations/auth";

describe("Authentication Validation Schemas", () => {
  describe("RegisterSchema", () => {
    it("should succeed with valid registration data", () => {
      const validData = {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };
      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail when name is shorter than 2 characters", () => {
      const invalidData = {
        name: "J",
        email: "jane@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };
      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 2 characters");
      }
    });

    it("should fail with invalid email format", () => {
      const invalidData = {
        name: "Jane Doe",
        email: "invalid-email-address",
        password: "Password123",
        confirmPassword: "Password123",
      };
      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("valid email");
      }
    });

    it("should fail when password is less than 8 characters", () => {
      const invalidData = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
      };
      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 8 characters");
      }
    });

    it("should fail when password lacks uppercase letter", () => {
      const invalidData = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        confirmPassword: "password123",
      };
      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("uppercase letter");
      }
    });

    it("should fail when password lacks a number", () => {
      const invalidData = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "PasswordXYZ",
        confirmPassword: "PasswordXYZ",
      };
      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("number");
      }
    });

    it("should fail when confirmPassword does not match password", () => {
      const invalidData = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      };
      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("do not match");
      }
    });
  });

  describe("LoginSchema", () => {
    it("should succeed with valid login data", () => {
      const validData = {
        email: "user@example.com",
        password: "Password123",
      };
      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail with invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "Password123",
      };
      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail with empty password", () => {
      const invalidData = {
        email: "user@example.com",
        password: "",
      };
      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
