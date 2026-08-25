import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getProjects } from "@/server/queries/project.queries";
import { getProjectTasks } from "@/server/queries/task.queries";
import { globalSearch } from "@/server/queries/search.queries";
import { TaskStatus, TaskPriority, ProjectMemberRole } from "@prisma/client";

describe("Search Integration (Project Search, Task Search, Global Search)", () => {
  let userA: { id: string; email: string; name: string | null };
  let userB: { id: string; email: string; name: string | null };

  let project1: { id: string; name: string; key: string };
  let project2: { id: string; name: string; key: string };
  let projectPrivateB: { id: string; name: string; key: string };

  let task1: { id: string; taskNumber: number };
  let task2: { id: string; taskNumber: number };

  beforeAll(async () => {
    // 1. Create two users
    userA = await prisma.user.create({
      data: {
        email: `searchuser-a-${Date.now()}@example.com`,
        name: "Search Tester A",
        password: "HashedPassword123",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `searchuser-b-${Date.now()}@example.com`,
        name: "Search Tester B",
        password: "HashedPassword123",
      },
    });

    // 2. Create projects for User A
    project1 = await prisma.project.create({
      data: {
        name: "Enterprise Architecture Portal",
        key: "EAP",
        description: "Core infrastructure for enterprise microservices.",
        userId: userA.id,
      },
    });

    project2 = await prisma.project.create({
      data: {
        name: "Mobile Banking Application",
        key: "MBA",
        description: "React Native iOS and Android banking app.",
        userId: userA.id,
      },
    });

    // User B membership in Project 2
    await prisma.projectMember.create({
      data: {
        projectId: project2.id,
        userId: userB.id,
        role: ProjectMemberRole.MEMBER,
      },
    });

    // Project private to User B (User A has no access)
    projectPrivateB = await prisma.project.create({
      data: {
        name: "Top Secret Quantum Vault",
        key: "TSQ",
        description: "Confidential research project.",
        userId: userB.id,
      },
    });

    // 3. Create tasks in Project 1
    task1 = await prisma.task.create({
      data: {
        taskNumber: 1,
        title: "Implement OAuth2 Authentication Flow",
        description: "Configure PKCE and token rotation.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        projectId: project1.id,
        creatorId: userA.id,
      },
    });

    task2 = await prisma.task.create({
      data: {
        taskNumber: 2,
        title: "Setup Postgres Replication",
        description: "Configure streaming replication with read replicas.",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        projectId: project1.id,
        creatorId: userA.id,
      },
    });

    // Create task in private project of User B
    await prisma.task.create({
      data: {
        taskNumber: 1,
        title: "Top Secret Key Rotation",
        description: "Quantum key distribution protocol.",
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        projectId: projectPrivateB.id,
        creatorId: userB.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });
    await prisma.$disconnect();
  });

  describe("5.1 Project Search", () => {
    it("should search projects by name", async () => {
      const results = await getProjects({ userId: userA.id, q: "Banking" });
      expect(results.length).toBe(1);
      expect(results[0].key).toBe("MBA");
    });

    it("should search projects by key (case-insensitive)", async () => {
      const results = await getProjects({ userId: userA.id, q: "eap" });
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Enterprise Architecture Portal");
    });

    it("should search projects by description", async () => {
      const results = await getProjects({ userId: userA.id, q: "microservices" });
      expect(results.length).toBe(1);
      expect(results[0].key).toBe("EAP");
    });

    it("should return empty list when no projects match query", async () => {
      const results = await getProjects({ userId: userA.id, q: "NonExistentKeyword999" });
      expect(results.length).toBe(0);
    });

    it("should never return private projects of other users in search", async () => {
      // User A searches for User B's secret project
      const results = await getProjects({ userId: userA.id, q: "Quantum" });
      expect(results.length).toBe(0);
    });
  });

  describe("5.2 Task Search in Project Task List", () => {
    it("should search tasks by title", async () => {
      const results = await getProjectTasks({
        projectId: project1.id,
        userId: userA.id,
        q: "OAuth2",
      });
      expect(results).not.toBeNull();
      expect(results?.tasks.length).toBe(1);
      expect(results?.tasks[0].id).toBe(task1.id);
    });

    it("should search tasks by description", async () => {
      const results = await getProjectTasks({
        projectId: project1.id,
        userId: userA.id,
        q: "read replicas",
      });
      expect(results?.tasks.length).toBe(1);
      expect(results?.tasks[0].id).toBe(task2.id);
    });

    it("should search tasks by task identifier (e.g. EAP-1 or EAP-2)", async () => {
      const byKey = await getProjectTasks({
        projectId: project1.id,
        userId: userA.id,
        q: "EAP-1",
      });
      expect(byKey?.tasks.length).toBe(1);
      expect(byKey?.tasks[0].id).toBe(task1.id);

      const byKey2 = await getProjectTasks({
        projectId: project1.id,
        userId: userA.id,
        q: "EAP-2",
      });
      expect(byKey2?.tasks.length).toBe(1);
      expect(byKey2?.tasks[0].id).toBe(task2.id);
    });

    it("should combine search with status and priority filters", async () => {
      // Matches title "Postgres" AND status DONE
      const matched = await getProjectTasks({
        projectId: project1.id,
        userId: userA.id,
        q: "Postgres",
        status: TaskStatus.DONE,
      });
      expect(matched?.tasks.length).toBe(1);

      // Search matches title "Postgres" but status TODO -> empty
      const notMatched = await getProjectTasks({
        projectId: project1.id,
        userId: userA.id,
        q: "Postgres",
        status: TaskStatus.TODO,
      });
      expect(notMatched?.tasks.length).toBe(0);
    });
  });

  describe("5.3 Global Search", () => {
    it("should return grouped projects and tasks matching query", async () => {
      const results = await globalSearch(userA.id, "Authentication");
      expect(results.projects.length).toBe(0);
      expect(results.tasks.length).toBe(1);
      expect(results.tasks[0].title).toBe("Implement OAuth2 Authentication Flow");
      expect(results.tasks[0].projectKey).toBe("EAP");
    });

    it("should return both matching projects and matching tasks", async () => {
      const results = await globalSearch(userA.id, "Portal");
      expect(results.projects.length).toBe(1);
      expect(results.projects[0].name).toBe("Enterprise Architecture Portal");
    });

    it("should respect authorization and exclude unauthorized projects and tasks", async () => {
      // User A searches for "Quantum" (which belongs to User B's secret project/task)
      const resultsUserA = await globalSearch(userA.id, "Quantum");
      expect(resultsUserA.projects.length).toBe(0);
      expect(resultsUserA.tasks.length).toBe(0);

      // User B searches for "Quantum" and sees the results
      const resultsUserB = await globalSearch(userB.id, "Quantum");
      expect(resultsUserB.projects.length).toBe(1);
      expect(resultsUserB.tasks.length).toBe(1);
    });

    it("should return empty results for empty or whitespace query", async () => {
      const emptyResults = await globalSearch(userA.id, "   ");
      expect(emptyResults.projects.length).toBe(0);
      expect(emptyResults.tasks.length).toBe(0);
    });
  });
});
