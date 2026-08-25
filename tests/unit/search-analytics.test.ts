import { describe, it, expect } from "vitest";

describe("Search and Analytics Unit Helpers", () => {
  describe("Completion Rate Calculation", () => {
    const calculateCompletionPercentage = (completed: number, total: number) => {
      if (total <= 0) return 0;
      return Math.round((completed / total) * 100);
    };

    it("should return 0 when total tasks is 0 without division-by-zero error", () => {
      expect(calculateCompletionPercentage(0, 0)).toBe(0);
      expect(calculateCompletionPercentage(5, 0)).toBe(0);
    });

    it("should calculate correct rounded percentage for various ratios", () => {
      expect(calculateCompletionPercentage(1, 3)).toBe(33);
      expect(calculateCompletionPercentage(2, 3)).toBe(67);
      expect(calculateCompletionPercentage(5, 10)).toBe(50);
      expect(calculateCompletionPercentage(10, 10)).toBe(100);
    });
  });

  describe("Overdue Task Logic", () => {
    const isTaskOverdue = (dueDate: Date | null, status: string, referenceDate: Date) => {
      if (!dueDate || status === "DONE") return false;
      const dueMidnight = new Date(dueDate).setHours(0, 0, 0, 0);
      const refMidnight = new Date(referenceDate).setHours(0, 0, 0, 0);
      return dueMidnight < refMidnight;
    };

    it("should mark task as overdue if dueDate is before reference date and status is not DONE", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const today = new Date();

      expect(isTaskOverdue(yesterday, "TODO", today)).toBe(true);
      expect(isTaskOverdue(yesterday, "IN_PROGRESS", today)).toBe(true);
      expect(isTaskOverdue(yesterday, "IN_REVIEW", today)).toBe(true);
    });

    it("should NOT mark task as overdue if status is DONE regardless of due date", () => {
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const today = new Date();

      expect(isTaskOverdue(lastMonth, "DONE", today)).toBe(false);
    });

    it("should NOT mark task as overdue if dueDate is null or in the future", () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const today = new Date();

      expect(isTaskOverdue(null, "TODO", today)).toBe(false);
      expect(isTaskOverdue(tomorrow, "TODO", today)).toBe(false);
    });
  });

  describe("Task Identifier Query Parser", () => {
    const parseSearchIdentifier = (query: string) => {
      const match = query.trim().match(/^(?:[a-zA-Z0-9]+-)?(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    };

    it("should extract numeric task sequence number from formatted key or raw number", () => {
      expect(parseSearchIdentifier("PRJ-1")).toBe(1);
      expect(parseSearchIdentifier("ARC-42")).toBe(42);
      expect(parseSearchIdentifier("7")).toBe(7);
      expect(parseSearchIdentifier("ALPHA-999")).toBe(999);
    });

    it("should return null for non-numeric queries", () => {
      expect(parseSearchIdentifier("login endpoint")).toBeNull();
      expect(parseSearchIdentifier("authentication")).toBeNull();
    });
  });
});
