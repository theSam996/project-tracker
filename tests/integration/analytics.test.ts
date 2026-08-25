import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getProjectAnalytics } from "@/server/queries/analytics.queries";
import { getDashboardAnalytics } from "@/server/queries/dashboard.queries";
import { TaskStatus, TaskPriority, ProjectStatus, ProjectMemberRole } from "@prisma/client";

describe("Analytics Integration (Project Analytics & Dashboard Metrics)", () => {
  let userA: { id: string; email: string; name: string | null };
  let userB: { id: string; email: string; name: string | null };

  let activeProjectWithTasks: { id: string; name: string; key: string };
  let emptyProject: { id: string; name: string; key: string };
  let userBPrivateProject: { id: string; name: string; key: string };

  beforeAll(async () => {
    // 1. Create two users
    userA = await prisma.user.create({
      data: {
        email: `analyticstest-a-${Date.now()}@example.com`,
        name: "Analytics Tester A",
        password: "HashedPassword123",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `analyticstest-b-${Date.now()}@example.com`,
        name: "Analytics Tester B",
        password: "HashedPassword123",
      },
    });

    // 2. Create Project with tasks for User A
    activeProjectWithTasks = await prisma.project.create({
      data: {
        name: "DevOps Pipeline Automation",
        key: "DPA",
        status: ProjectStatus.ACTIVE,
        userId: userA.id,
      },
    });

    // Add userB as member to active project
    await prisma.projectMember.create({
      data: {
        projectId: activeProjectWithTasks.id,
        userId: userB.id,
        role: ProjectMemberRole.MEMBER,
      },
    });

    // Create tasks:
    // Task 1: DONE, Low priority, assigned to userA
    await prisma.task.create({
      data: {
        taskNumber: 1,
        title: "Dockerize Web Application",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        projectId: activeProjectWithTasks.id,
        userId: userA.id,
        creatorId: userA.id,
      },
    });

    // Task 2: IN_PROGRESS, High priority, assigned to userB, OVERDUE
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.task.create({
      data: {
        taskNumber: 2,
        title: "Setup CI/CD Workflow",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: yesterday,
        projectId: activeProjectWithTasks.id,
        userId: userB.id,
        creatorId: userA.id,
      },
    });

    // Task 3: TODO, Urgent priority, unassigned
    await prisma.task.create({
      data: {
        taskNumber: 3,
        title: "Configure Kubernetes Ingress",
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        projectId: activeProjectWithTasks.id,
        creatorId: userA.id,
      },
    });

    // Task 4: IN_REVIEW, Medium priority, assigned to userA
    await prisma.task.create({
      data: {
        taskNumber: 4,
        title: "Review Helm Charts",
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.MEDIUM,
        projectId: activeProjectWithTasks.id,
        userId: userA.id,
        creatorId: userA.id,
      },
    });

    // 3. Create Empty Project for User A
    emptyProject = await prisma.project.create({
      data: {
        name: "Empty Scratchpad Project",
        key: "ESP",
        status: ProjectStatus.PLANNING,
        userId: userA.id,
      },
    });

    // 4. Create Private Project for User B (User A has no access)
    userBPrivateProject = await prisma.project.create({
      data: {
        name: "User B Secret Project",
        key: "USP",
        status: ProjectStatus.ACTIVE,
        userId: userB.id,
      },
    });

    await prisma.task.create({
      data: {
        taskNumber: 1,
        title: "User B Secret Task",
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        projectId: userBPrivateProject.id,
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

  describe("5.5 - 5.10 Project Analytics", () => {
    it("should compute accurate task counts and completion percentage", async () => {
      const analytics = await getProjectAnalytics(activeProjectWithTasks.id, userA.id);

      expect(analytics).not.toBeNull();
      expect(analytics?.totalTasks).toBe(4);
      expect(analytics?.completedTasks).toBe(1);
      expect(analytics?.inProgressTasks).toBe(1);
      expect(analytics?.todoTasks).toBe(1);
      expect(analytics?.inReviewTasks).toBe(1);
      // 1 / 4 = 25%
      expect(analytics?.completionPercentage).toBe(25);
    });

    it("should identify overdue tasks correctly", async () => {
      const analytics = await getProjectAnalytics(activeProjectWithTasks.id, userA.id);

      expect(analytics?.overdueTasksCount).toBe(1);
      expect(analytics?.overdueTasks.length).toBe(1);
      expect(analytics?.overdueTasks[0].title).toBe("Setup CI/CD Workflow");
    });

    it("should compute correct status, priority, and assignee workload breakdowns", async () => {
      const analytics = await getProjectAnalytics(activeProjectWithTasks.id, userA.id);

      // Priority counts
      const urgentPriority = analytics?.priorityBreakdown.find((p) => p.priority === TaskPriority.URGENT);
      expect(urgentPriority?.count).toBe(1);

      const highPriority = analytics?.priorityBreakdown.find((p) => p.priority === TaskPriority.HIGH);
      expect(highPriority?.count).toBe(1);

      // Assignee counts
      const userAWorkload = analytics?.assigneeBreakdown.find((a) => a.id === userA.id);
      expect(userAWorkload?.taskCount).toBe(2);
      expect(userAWorkload?.completedCount).toBe(1);

      const userBWorkload = analytics?.assigneeBreakdown.find((a) => a.id === userB.id);
      expect(userBWorkload?.taskCount).toBe(1);
      expect(userBWorkload?.completedCount).toBe(0);

      // Unassigned
      expect(analytics?.unassignedCount).toBe(1);
    });

    it("should handle empty project with 0 tasks safely without errors", async () => {
      const analytics = await getProjectAnalytics(emptyProject.id, userA.id);

      expect(analytics).not.toBeNull();
      expect(analytics?.totalTasks).toBe(0);
      expect(analytics?.completedTasks).toBe(0);
      expect(analytics?.completionPercentage).toBe(0);
      expect(analytics?.overdueTasksCount).toBe(0);
      expect(analytics?.assigneeBreakdown.length).toBe(0);
      expect(analytics?.unassignedCount).toBe(0);
    });

    it("should deny analytics access to unauthorized users", async () => {
      // User A attempts to view User B's secret project analytics
      const unauthorizedAnalytics = await getProjectAnalytics(userBPrivateProject.id, userA.id);
      expect(unauthorizedAnalytics).toBeNull();
    });
  });

  describe("5.11 - 5.14 Dashboard Multi-Project Analytics", () => {
    it("should aggregate multi-project metrics for authenticated user", async () => {
      const dashboard = await getDashboardAnalytics(userA.id);

      // User A has 2 owned projects (activeProjectWithTasks, emptyProject)
      expect(dashboard.totalProjects).toBe(2);
      expect(dashboard.activeProjects).toBe(2);
      expect(dashboard.totalTasks).toBe(4);
      expect(dashboard.completedTasks).toBe(1);
      expect(dashboard.overdueTasks).toBe(1);
      expect(dashboard.overallCompletionRate).toBe(25);

      // Recent projects and tasks
      expect(dashboard.recentProjects.length).toBe(2);
      expect(dashboard.recentTasks.length).toBe(4);
    });

    it("should include shared projects where user is a member in dashboard metrics", async () => {
      const dashboardUserB = await getDashboardAnalytics(userB.id);

      // User B has 1 owned project (userBPrivateProject with 1 task) + 1 member project (activeProjectWithTasks with 4 tasks)
      expect(dashboardUserB.totalProjects).toBe(2);
      expect(dashboardUserB.totalTasks).toBe(5);
      expect(dashboardUserB.completedTasks).toBe(2); // 1 from DPA, 1 from USP
    });
  });
});
