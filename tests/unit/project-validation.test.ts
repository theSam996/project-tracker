import { describe, it, expect } from "vitest";
import { CreateProjectSchema, UpdateProjectSchema } from "@/lib/validations/project";
import { AddMemberSchema, UpdateMemberRoleSchema } from "@/lib/validations/member";
import { ProjectStatus, ProjectMemberRole } from "@prisma/client";

describe("Project Management Validation Schemas", () => {
  describe("CreateProjectSchema", () => {
    it("should succeed with valid project data and normalize key to uppercase", () => {
      const validData = {
        name: "Website Redesign",
        key: "web",
        description: "A complete visual overhaul.",
        status: ProjectStatus.ACTIVE,
        startDate: "2026-09-01",
        targetDate: "2026-12-01",
      };

      const result = CreateProjectSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("WEB"); // Uppercase normalization
        expect(result.data.name).toBe("Website Redesign");
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.targetDate).toBeInstanceOf(Date);
      }
    });

    it("should fail when project name is shorter than 2 characters", () => {
      const invalidData = {
        name: "A",
        key: "PRJ",
      };

      const result = CreateProjectSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 2 characters");
      }
    });

    it("should fail when project key has invalid characters", () => {
      const invalidData = {
        name: "Mobile Application",
        key: "MOB$#",
      };

      const result = CreateProjectSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("alphanumeric");
      }
    });

    it("should fail when project key is too short or too long", () => {
      const tooShort = { name: "Project Short", key: "P" };
      const tooLong = { name: "Project Long", key: "TOOLONGKEYNAME" };

      expect(CreateProjectSchema.safeParse(tooShort).success).toBe(false);
      expect(CreateProjectSchema.safeParse(tooLong).success).toBe(false);
    });

    it("should fail when startDate is after targetDate", () => {
      const invalidDates = {
        name: "Timeline Test",
        key: "TIME",
        startDate: "2026-12-01",
        targetDate: "2026-09-01",
      };

      const result = CreateProjectSchema.safeParse(invalidDates);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Start date cannot be after target date");
      }
    });

    it("should succeed when dates are equal", () => {
      const sameDates = {
        name: "One Day Sprint",
        key: "SPRINT",
        startDate: "2026-10-10",
        targetDate: "2026-10-10",
      };

      const result = CreateProjectSchema.safeParse(sameDates);
      expect(result.success).toBe(true);
    });
  });

  describe("UpdateProjectSchema", () => {
    it("should succeed with valid update data", () => {
      const updateData = {
        name: "Updated Name",
        key: "UPD",
        status: ProjectStatus.COMPLETED,
      };

      const result = UpdateProjectSchema.safeParse(updateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("UPD");
        expect(result.data.status).toBe(ProjectStatus.COMPLETED);
      }
    });
  });

  describe("Member Management Schemas", () => {
    it("should validate AddMemberSchema with valid email and role", () => {
      const valid = {
        email: "member@example.com",
        role: ProjectMemberRole.MEMBER,
      };

      const result = AddMemberSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email in AddMemberSchema", () => {
      const invalid = {
        email: "not-an-email",
        role: ProjectMemberRole.MEMBER,
      };

      const result = AddMemberSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should validate UpdateMemberRoleSchema", () => {
      const valid = {
        memberId: "cuid123456",
        role: ProjectMemberRole.VIEWER,
      };

      const result = UpdateMemberRoleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
