import { describe, it, expect } from "vitest";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  MoveTaskSchema,
} from "@/lib/validations/task";
import { TaskStatus, TaskPriority } from "@prisma/client";

describe("Task Management Validation Schemas", () => {
  describe("CreateTaskSchema", () => {
    it("should succeed with valid task data", () => {
      const validData = {
        title: "Setup Auth Tokens",
        description: "Implement JWT verification with JOSE.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        assigneeId: "cuid12345",
        dueDate: "2026-09-15",
      };

      const result = CreateTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Setup Auth Tokens");
        expect(result.data.status).toBe(TaskStatus.IN_PROGRESS);
        expect(result.data.priority).toBe(TaskPriority.HIGH);
        expect(result.data.dueDate).toBeInstanceOf(Date);
      }
    });

    it("should fail when title is empty", () => {
      const invalidData = {
        title: "   ",
      };

      const result = CreateTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Task title is required");
      }
    });

    it("should fail when title exceeds 150 characters", () => {
      const invalidData = {
        title: "A".repeat(151),
      };

      const result = CreateTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail when description exceeds 2000 characters", () => {
      const invalidData = {
        title: "Valid Title",
        description: "B".repeat(2001),
      };

      const result = CreateTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateTaskSchema", () => {
    it("should succeed with valid update data", () => {
      const validUpdate = {
        title: "Refactor Database Client",
        status: TaskStatus.DONE,
        priority: TaskPriority.URGENT,
      };

      const result = UpdateTaskSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(TaskStatus.DONE);
        expect(result.data.priority).toBe(TaskPriority.URGENT);
      }
    });
  });

  describe("MoveTaskSchema", () => {
    it("should succeed with valid move parameters", () => {
      const validMove = {
        taskId: "task_123",
        status: TaskStatus.IN_REVIEW,
        order: 3,
      };

      const result = MoveTaskSchema.safeParse(validMove);
      expect(result.success).toBe(true);
    });

    it("should fail when order is negative", () => {
      const invalidMove = {
        taskId: "task_123",
        status: TaskStatus.TODO,
        order: -1,
      };

      const result = MoveTaskSchema.safeParse(invalidMove);
      expect(result.success).toBe(false);
    });
  });
});
