import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  updateProject,
  archiveProject,
  deleteProject,
} from "@/server/actions/project.actions";
import {
  addProjectMember,
} from "@/server/actions/member.actions";
import { getProjects, getProjectById } from "@/server/queries/project.queries";
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

describe("Project Authorization and Retrieval Isolation", () => {
  let ownerUser: { id: string; email: string; name: string | null };
  let memberUser: { id: string; email: string; name: string | null };
  let viewerUser: { id: string; email: string; name: string | null };
  let outsiderUser: { id: string; email: string; name: string | null };

  let testProject: { id: string; name: string; key: string };
  let archivedProject: { id: string; name: string; key: string };

  beforeAll(async () => {
    // 1. Create users
    ownerUser = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@example.com`,
        name: "Project Owner",
        password: "HashedPassword123",
      },
    });

    memberUser = await prisma.user.create({
      data: {
        email: `member-${Date.now()}@example.com`,
        name: "Project Member",
        password: "HashedPassword123",
      },
    });

    viewerUser = await prisma.user.create({
      data: {
        email: `viewer-${Date.now()}@example.com`,
        name: "Project Viewer",
        password: "HashedPassword123",
      },
    });

    outsiderUser = await prisma.user.create({
      data: {
        email: `outsider-${Date.now()}@example.com`,
        name: "Outside User",
        password: "HashedPassword123",
      },
    });

    // 2. Create projects
    const p1 = await prisma.project.create({
      data: {
        name: "Core Infrastructure",
        key: "CORE",
        status: ProjectStatus.ACTIVE,
        userId: ownerUser.id,
      },
    });
    testProject = p1;

    // Add members
    await prisma.projectMember.createMany({
      data: [
        { projectId: p1.id, userId: ownerUser.id, role: ProjectMemberRole.OWNER },
        { projectId: p1.id, userId: memberUser.id, role: ProjectMemberRole.MEMBER },
        { projectId: p1.id, userId: viewerUser.id, role: ProjectMemberRole.VIEWER },
      ],
    });

    // Create an archived project for owner
    const p2 = await prisma.project.create({
      data: {
        name: "Legacy System",
        key: "LEGACY",
        status: ProjectStatus.ARCHIVED,
        userId: ownerUser.id,
      },
    });
    archivedProject = p2;

    await prisma.projectMember.create({
      data: { projectId: p2.id, userId: ownerUser.id, role: ProjectMemberRole.OWNER },
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

  describe("Mutation Authorization Safeguards", () => {
    it("should allow owner to edit project", async () => {
      currentMockUser = ownerUser;
      const result = await updateProject(testProject.id, {
        name: "Core Infrastructure 2.0",
        key: "CORE",
        status: ProjectStatus.ACTIVE,
      });

      expect(result.success).toBe(true);
    });

    it("should reject member from editing project", async () => {
      currentMockUser = memberUser;
      const result = await updateProject(testProject.id, {
        name: "Hacked by Member",
        key: "CORE",
        status: ProjectStatus.ACTIVE,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("should reject viewer from editing project", async () => {
      currentMockUser = viewerUser;
      const result = await updateProject(testProject.id, {
        name: "Hacked by Viewer",
        key: "CORE",
        status: ProjectStatus.ACTIVE,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("should reject non-owner from archiving project", async () => {
      currentMockUser = memberUser;
      const result = await archiveProject(testProject.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("should reject non-owner from deleting project", async () => {
      currentMockUser = memberUser;
      const result = await deleteProject(testProject.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("should reject non-owner from adding members", async () => {
      currentMockUser = viewerUser;
      const result = await addProjectMember(testProject.id, {
        email: outsiderUser.email,
        role: ProjectMemberRole.MEMBER,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Query Retrieval & Access Isolation", () => {
    it("should allow owner to fetch project by ID", async () => {
      const project = await getProjectById(testProject.id, ownerUser.id);
      expect(project).not.toBeNull();
      expect(project?.isOwner).toBe(true);
      expect(project?.userRole).toBe(ProjectMemberRole.OWNER);
    });

    it("should allow member to fetch project by ID", async () => {
      const project = await getProjectById(testProject.id, memberUser.id);
      expect(project).not.toBeNull();
      expect(project?.isOwner).toBe(false);
      expect(project?.userRole).toBe(ProjectMemberRole.MEMBER);
    });

    it("should allow viewer to fetch project by ID", async () => {
      const project = await getProjectById(testProject.id, viewerUser.id);
      expect(project).not.toBeNull();
      expect(project?.isOwner).toBe(false);
      expect(project?.userRole).toBe(ProjectMemberRole.VIEWER);
    });

    it("should deny unauthorized outsider from fetching project by ID", async () => {
      const project = await getProjectById(testProject.id, outsiderUser.id);
      expect(project).toBeNull();
    });

    it("should retrieve only accessible projects for a user in getProjects", async () => {
      const outsiderProjects = await getProjects({ userId: outsiderUser.id });
      expect(outsiderProjects.length).toBe(0);

      const memberProjects = await getProjects({ userId: memberUser.id });
      expect(memberProjects.some((p) => p.id === testProject.id)).toBe(true);
    });

    it("should filter out archived projects by default", async () => {
      const ownerProjects = await getProjects({ userId: ownerUser.id });
      expect(ownerProjects.some((p) => p.id === testProject.id)).toBe(true);
      expect(ownerProjects.some((p) => p.id === archivedProject.id)).toBe(false);
    });

    it("should return archived projects when status=ARCHIVED", async () => {
      const archivedList = await getProjects({
        userId: ownerUser.id,
        status: ProjectStatus.ARCHIVED,
      });
      expect(archivedList.some((p) => p.id === archivedProject.id)).toBe(true);
      expect(archivedList.some((p) => p.id === testProject.id)).toBe(false);
    });

    it("should search projects by name or key", async () => {
      const searchByName = await getProjects({
        userId: ownerUser.id,
        q: "Infrastructure",
      });
      expect(searchByName.some((p) => p.id === testProject.id)).toBe(true);

      const searchByKey = await getProjects({
        userId: ownerUser.id,
        q: "CORE",
      });
      expect(searchByKey.some((p) => p.id === testProject.id)).toBe(true);

      const noMatch = await getProjects({
        userId: ownerUser.id,
        q: "NONEXISTENT_QUERY_12345",
      });
      expect(noMatch.length).toBe(0);
    });
  });
});
