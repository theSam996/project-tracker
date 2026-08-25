import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
} from "@/server/actions/project.actions";
import {
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
} from "@/server/actions/member.actions";
import { ProjectStatus, ProjectMemberRole } from "@prisma/client";

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

describe("Project Management Server Actions Integration", () => {
  let userA: { id: string; email: string; name: string | null };
  let userB: { id: string; email: string; name: string | null };
  let userC: { id: string; email: string; name: string | null };

  beforeAll(async () => {
    // Create distinct test users
    userA = await prisma.user.create({
      data: {
        email: `usera-${Date.now()}@example.com`,
        name: "User Owner A",
        password: "HashedPassword123",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `userb-${Date.now()}@example.com`,
        name: "User Member B",
        password: "HashedPassword123",
      },
    });

    userC = await prisma.user.create({
      data: {
        email: `userc-${Date.now()}@example.com`,
        name: "User Viewer C",
        password: "HashedPassword123",
      },
    });
  });

  afterAll(async () => {
    // Cleanup users (cascades to projects, members, etc.)
    await prisma.user.deleteMany({
      where: {
        id: { in: [userA.id, userB.id, userC.id] },
      },
    });
    await prisma.$disconnect();
  });

  it("should fail project creation when unauthenticated", async () => {
    currentMockUser = null;
    const result = await createProject({
      name: "Unauthenticated Project",
      key: "NOAUTH",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Authentication required");
  });

  let createdProjectId: string;

  it("should successfully create a new project and add owner as member", async () => {
    currentMockUser = userA;
    const result = await createProject({
      name: "Alpha Rocket Project",
      key: "alpha", // Lowercase will be normalized to ALPHA
      description: "Building the next-gen launch platform",
      status: ProjectStatus.PLANNING,
      startDate: "2026-09-01",
      targetDate: "2026-12-31",
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBeDefined();
    expect(result.data?.key).toBe("ALPHA");

    createdProjectId = result.data!.id;

    // Verify database record
    const dbProject = await prisma.project.findUnique({
      where: { id: createdProjectId },
      include: { members: true },
    });

    expect(dbProject).not.toBeNull();
    expect(dbProject?.name).toBe("Alpha Rocket Project");
    expect(dbProject?.key).toBe("ALPHA");
    expect(dbProject?.userId).toBe(userA.id);
    expect(dbProject?.members.length).toBe(1);
    expect(dbProject?.members[0]?.userId).toBe(userA.id);
    expect(dbProject?.members[0]?.role).toBe(ProjectMemberRole.OWNER);
  });

  it("should reject duplicate project key for the same owner", async () => {
    currentMockUser = userA;
    const result = await createProject({
      name: "Duplicate Alpha Project",
      key: "ALPHA",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists in your workspace');
  });

  it("should update project details successfully by owner", async () => {
    currentMockUser = userA;
    const result = await updateProject(createdProjectId, {
      name: "Alpha Rocket Project - Updated",
      key: "ALPHAU",
      description: "Updated description",
      status: ProjectStatus.ACTIVE,
    });

    expect(result.success).toBe(true);

    const dbProject = await prisma.project.findUnique({
      where: { id: createdProjectId },
    });
    expect(dbProject?.name).toBe("Alpha Rocket Project - Updated");
    expect(dbProject?.key).toBe("ALPHAU");
    expect(dbProject?.status).toBe(ProjectStatus.ACTIVE);
  });

  it("should add a registered user as a project member", async () => {
    currentMockUser = userA;
    const result = await addProjectMember(createdProjectId, {
      email: userB.email,
      role: ProjectMemberRole.MEMBER,
    });

    expect(result.success).toBe(true);

    const members = await prisma.projectMember.findMany({
      where: { projectId: createdProjectId },
    });

    expect(members.some((m) => m.userId === userB.id && m.role === ProjectMemberRole.MEMBER)).toBe(true);
  });

  it("should reject adding non-existent user email", async () => {
    currentMockUser = userA;
    const result = await addProjectMember(createdProjectId, {
      email: "nonexistent-user-xyz@example.com",
      role: ProjectMemberRole.MEMBER,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No registered user found");
  });

  it("should reject duplicate member addition", async () => {
    currentMockUser = userA;
    const result = await addProjectMember(createdProjectId, {
      email: userB.email,
      role: ProjectMemberRole.MEMBER,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("already a member");
  });

  it("should update member role to VIEWER", async () => {
    currentMockUser = userA;
    const memberB = await prisma.projectMember.findFirst({
      where: { projectId: createdProjectId, userId: userB.id },
    });

    expect(memberB).not.toBeNull();

    const result = await updateProjectMemberRole(createdProjectId, {
      memberId: memberB!.id,
      role: ProjectMemberRole.VIEWER,
    });

    expect(result.success).toBe(true);

    const updated = await prisma.projectMember.findUnique({
      where: { id: memberB!.id },
    });
    expect(updated?.role).toBe(ProjectMemberRole.VIEWER);
  });

  it("should remove a project member", async () => {
    currentMockUser = userA;
    const memberB = await prisma.projectMember.findFirst({
      where: { projectId: createdProjectId, userId: userB.id },
    });

    const result = await removeProjectMember(createdProjectId, memberB!.id);
    expect(result.success).toBe(true);

    const dbMember = await prisma.projectMember.findUnique({
      where: { id: memberB!.id },
    });
    expect(dbMember).toBeNull();
  });

  it("should archive a project without deleting it", async () => {
    currentMockUser = userA;
    const result = await archiveProject(createdProjectId);
    expect(result.success).toBe(true);

    const dbProject = await prisma.project.findUnique({
      where: { id: createdProjectId },
    });
    expect(dbProject).not.toBeNull();
    expect(dbProject?.status).toBe(ProjectStatus.ARCHIVED);
  });

  it("should permanently delete a project and cascade member records", async () => {
    currentMockUser = userA;
    const result = await deleteProject(createdProjectId);
    expect(result.success).toBe(true);

    const dbProject = await prisma.project.findUnique({
      where: { id: createdProjectId },
    });
    expect(dbProject).toBeNull();

    const dbMembers = await prisma.projectMember.findMany({
      where: { projectId: createdProjectId },
    });
    expect(dbMembers.length).toBe(0);
  });
});
