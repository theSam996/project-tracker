import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTask,
  updateTask,
  moveTask,
  deleteTask,
} from "@/server/actions/task.actions";
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

describe("Task Management Server Actions Integration", () => {
  let ownerUser: { id: string; email: string; name: string | null };
  let memberUser: { id: string; email: string; name: string | null };
  let outsiderUser: { id: string; email: string; name: string | null };
  let project: { id: string; name: string; key: string };

  beforeAll(async () => {
    // 1. Create users
    ownerUser = await prisma.user.create({
      data: {
        email: `taskowner-${Date.now()}@example.com`,
        name: "Task Owner",
        password: "HashedPassword123",
      },
    });

    memberUser = await prisma.user.create({
      data: {
        email: `taskmember-${Date.now()}@example.com`,
        name: "Task Member",
        password: "HashedPassword123",
      },
    });

    outsiderUser = await prisma.user.create({
      data: {
        email: `taskoutsider-${Date.now()}@example.com`,
        name: "Task Outsider",
        password: "HashedPassword123",
      },
    });

    // 2. Create project
    project = await prisma.project.create({
      data: {
        name: "Mission Control",
        key: "MC",
        userId: ownerUser.id,
      },
    });

    // 3. Add members
    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: ownerUser.id, role: ProjectMemberRole.OWNER },
        { projectId: project.id, userId: memberUser.id, role: ProjectMemberRole.MEMBER },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: { in: [ownerUser.id, memberUser.id, outsiderUser.id] },
      },
    });
    await prisma.$disconnect();
  });

  let task1Id: string;
  let task2Id: string;

  it("should create tasks with sequential taskNumbers within the project", async () => {
    currentMockUser = ownerUser;

    // Create Task 1
    const res1 = await createTask(project.id, {
      title: "First Task",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
    });

    expect(res1.success).toBe(true);
    expect(res1.data?.taskNumber).toBe(1);
    task1Id = res1.data!.id;

    // Create Task 2
    const res2 = await createTask(project.id, {
      title: "Second Task",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: memberUser.id,
    });

    expect(res2.success).toBe(true);
    expect(res2.data?.taskNumber).toBe(2);
    task2Id = res2.data!.id;

    // Check in database
    const dbTask2 = await prisma.task.findUnique({
      where: { id: task2Id },
    });
    expect(dbTask2?.userId).toBe(memberUser.id);
    expect(dbTask2?.creatorId).toBe(ownerUser.id);
    expect(dbTask2?.order).toBeGreaterThanOrEqual(1);
  });

  it("should reject assigning a task to a non-member", async () => {
    currentMockUser = ownerUser;
    const res = await createTask(project.id, {
      title: "Invalid Assignee Task",
      assigneeId: outsiderUser.id,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Assignee must be a member of this project");
  });

  it("should update task fields successfully", async () => {
    currentMockUser = memberUser;
    const updateRes = await updateTask(project.id, task1Id, {
      title: "First Task - Updated Title",
      description: "Added comprehensive details.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      assigneeId: memberUser.id,
    });

    expect(updateRes.success).toBe(true);

    const dbTask = await prisma.task.findUnique({
      where: { id: task1Id },
    });
    expect(dbTask?.title).toBe("First Task - Updated Title");
    expect(dbTask?.status).toBe(TaskStatus.IN_PROGRESS);
    expect(dbTask?.priority).toBe(TaskPriority.URGENT);
    expect(dbTask?.userId).toBe(memberUser.id);
  });

  it("should move task status and update Kanban ordering", async () => {
    currentMockUser = ownerUser;
    const moveRes = await moveTask(project.id, {
      taskId: task1Id,
      status: TaskStatus.DONE,
      order: 5,
    });

    expect(moveRes.success).toBe(true);

    const dbTask = await prisma.task.findUnique({
      where: { id: task1Id },
    });
    expect(dbTask?.status).toBe(TaskStatus.DONE);
    expect(dbTask?.order).toBe(5);
  });

  it("should delete a task", async () => {
    currentMockUser = ownerUser;
    const deleteRes = await deleteTask(project.id, task2Id);
    expect(deleteRes.success).toBe(true);

    const dbTask = await prisma.task.findUnique({
      where: { id: task2Id },
    });
    expect(dbTask).toBeNull();
  });
});
