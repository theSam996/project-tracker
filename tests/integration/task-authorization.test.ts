import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTask,
  updateTask,
  moveTask,
} from "@/server/actions/task.actions";
import {
  getProjectTasks,
  getKanbanTasks,
  getTaskById,
} from "@/server/queries/task.queries";
import { TaskStatus, TaskPriority, ProjectMemberRole } from "@prisma/client";

// Global mock state for logged-in user
let currentMockUser: { id: string; email: string; name: string | null } | null = null;

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(() => Promise.resolve(currentMockUser)),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Task Authorization, Access Isolation, and Query Filtering", () => {
  let ownerUser: { id: string; email: string; name: string | null };
  let memberUser: { id: string; email: string; name: string | null };
  let viewerUser: { id: string; email: string; name: string | null };
  let outsiderUser: { id: string; email: string; name: string | null };

  let projectA: { id: string; name: string; key: string };
  let projectB: { id: string; name: string; key: string };

  let taskA1: { id: string; taskNumber: number };
  let taskA2: { id: string; taskNumber: number };

  beforeAll(async () => {
    // 1. Create users
    ownerUser = await prisma.user.create({
      data: {
        email: `taskauth-owner-${Date.now()}@example.com`,
        name: "Project Owner",
        password: "HashedPassword123",
      },
    });

    memberUser = await prisma.user.create({
      data: {
        email: `taskauth-member-${Date.now()}@example.com`,
        name: "Project Member",
        password: "HashedPassword123",
      },
    });

    viewerUser = await prisma.user.create({
      data: {
        email: `taskauth-viewer-${Date.now()}@example.com`,
        name: "Project Viewer",
        password: "HashedPassword123",
      },
    });

    outsiderUser = await prisma.user.create({
      data: {
        email: `taskauth-outsider-${Date.now()}@example.com`,
        name: "Outside User",
        password: "HashedPassword123",
      },
    });

    // 2. Create Project A (with owner, member, viewer)
    projectA = await prisma.project.create({
      data: {
        name: "Project Alpha",
        key: "ALPHA",
        userId: ownerUser.id,
      },
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: projectA.id, userId: ownerUser.id, role: ProjectMemberRole.OWNER },
        { projectId: projectA.id, userId: memberUser.id, role: ProjectMemberRole.MEMBER },
        { projectId: projectA.id, userId: viewerUser.id, role: ProjectMemberRole.VIEWER },
      ],
    });

    // 3. Create Project B (for cross-project checks)
    projectB = await prisma.project.create({
      data: {
        name: "Project Beta",
        key: "BETA",
        userId: outsiderUser.id,
      },
    });

    // 4. Create tasks in Project A
    taskA1 = await prisma.task.create({
      data: {
        taskNumber: 1,
        title: "Alpha Task One",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        projectId: projectA.id,
        userId: memberUser.id,
        creatorId: ownerUser.id,
      },
    });

    taskA2 = await prisma.task.create({
      data: {
        taskNumber: 2,
        title: "Alpha Task Two",
        status: TaskStatus.DONE,
        priority: TaskPriority.URGENT,
        projectId: projectA.id,
        creatorId: memberUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: { in: [ownerUser.id, memberUser.id, viewerUser.id, outsiderUser.id] },
      },
    });
    await prisma.$disconnect();
  });

  describe("Role-based Mutation Safeguards", () => {
    it("should allow member to create task", async () => {
      currentMockUser = memberUser;
      const res = await createTask(projectA.id, {
        title: "Member Created Task",
      });

      expect(res.success).toBe(true);
    });

    it("should reject viewer from creating task", async () => {
      currentMockUser = viewerUser;
      const res = await createTask(projectA.id, {
        title: "Viewer Cannot Create",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("should reject viewer from editing task", async () => {
      currentMockUser = viewerUser;
      const res = await updateTask(projectA.id, taskA1.id, {
        title: "Viewer Cannot Edit",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("should reject viewer from moving task in Kanban", async () => {
      currentMockUser = viewerUser;
      const res = await moveTask(projectA.id, {
        taskId: taskA1.id,
        status: TaskStatus.DONE,
        order: 1,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("should reject unauthorized outsider from accessing or modifying task", async () => {
      currentMockUser = outsiderUser;
      const res = await updateTask(projectA.id, taskA1.id, {
        title: "Outsider Hack",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("should prevent cross-project task modification", async () => {
      currentMockUser = ownerUser;
      // Try updating taskA1 using projectB.id
      const res = await updateTask(projectB.id, taskA1.id, {
        title: "Cross project update",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
      });

      expect(res.success).toBe(false);
    });
  });

  describe("Query Retrieval and Filtering", () => {
    it("should allow owner, member, and viewer to fetch Kanban columns", async () => {
      const kanbanOwner = await getKanbanTasks(projectA.id, ownerUser.id);
      expect(kanbanOwner).not.toBeNull();
      expect(kanbanOwner?.columns[TaskStatus.TODO].length).toBeGreaterThanOrEqual(1);
      expect(kanbanOwner?.columns[TaskStatus.DONE].some((t) => t.id === taskA2.id)).toBe(true);

      const kanbanViewer = await getKanbanTasks(projectA.id, viewerUser.id);
      expect(kanbanViewer).not.toBeNull();
      expect(kanbanViewer?.userRole).toBe(ProjectMemberRole.VIEWER);
    });

    it("should deny outsider from fetching Kanban tasks", async () => {
      const kanbanOutsider = await getKanbanTasks(projectA.id, outsiderUser.id);
      expect(kanbanOutsider).toBeNull();
    });

    it("should filter task list by status and priority", async () => {
      const todoTasks = await getProjectTasks({
        projectId: projectA.id,
        userId: ownerUser.id,
        status: TaskStatus.TODO,
      });

      expect(todoTasks).not.toBeNull();
      expect(todoTasks?.tasks.every((t) => t.status === TaskStatus.TODO)).toBe(true);

      const urgentTasks = await getProjectTasks({
        projectId: projectA.id,
        userId: ownerUser.id,
        priority: TaskPriority.URGENT,
      });

      expect(urgentTasks?.tasks.every((t) => t.priority === TaskPriority.URGENT)).toBe(true);
    });

    it("should filter task list by assignee", async () => {
      const memberTasks = await getProjectTasks({
        projectId: projectA.id,
        userId: ownerUser.id,
        assigneeId: memberUser.id,
      });

      expect(memberTasks?.tasks.some((t) => t.id === taskA1.id)).toBe(true);
    });

    it("should allow fetching task detail by ID", async () => {
      const taskDetail = await getTaskById(projectA.id, taskA1.id, ownerUser.id);
      expect(taskDetail).not.toBeNull();
      expect(taskDetail?.task.taskIdentifier).toBe("ALPHA-1");
      expect(taskDetail?.canEdit).toBe(true);
    });

    it("should prevent cross-project task detail retrieval", async () => {
      // taskA1 belongs to projectA, querying with projectB.id should return null
      const taskDetail = await getTaskById(projectB.id, taskA1.id, outsiderUser.id);
      expect(taskDetail).toBeNull();
    });
  });
});
