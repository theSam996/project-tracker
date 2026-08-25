import { prisma } from "@/lib/prisma";
import { ProjectStatus, TaskStatus, TaskPriority } from "@prisma/client";

export interface RecentProjectItem {
  id: string;
  name: string;
  key: string;
  status: ProjectStatus;
  updatedAt: Date;
  taskCount: number;
  completedTaskCount: number;
  progressPercentage: number;
}

export interface RecentTaskItem {
  id: string;
  taskNumber: number;
  taskIdentifier: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  updatedAt: Date;
  projectId: string;
  projectName: string;
  projectKey: string;
}

export interface DashboardAnalyticsData {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  overallCompletionRate: number;
  recentProjects: RecentProjectItem[];
  recentTasks: RecentTaskItem[];
}

/**
 * Fetch authoritative multi-project dashboard analytics for the authenticated user
 */
export async function getDashboardAnalytics(
  userId: string
): Promise<DashboardAnalyticsData> {
  const accessibleProjectFilter = {
    OR: [{ userId }, { members: { some: { userId } } }],
  };

  const nowTime = new Date().setHours(0, 0, 0, 0);

  // 1. Fetch accessible projects summary
  const projects = await prisma.project.findMany({
    where: accessibleProjectFilter,
    orderBy: { updatedAt: "desc" },
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
  });

  const totalProjects = projects.length;
  let activeProjects = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let overdueTasks = 0;

  projects.forEach((p) => {
    if (p.status !== ProjectStatus.ARCHIVED) {
      activeProjects++;
    }

    p.tasks.forEach((t) => {
      totalTasks++;
      if (t.status === TaskStatus.DONE) {
        completedTasks++;
      } else if (t.dueDate && new Date(t.dueDate).getTime() < nowTime) {
        overdueTasks++;
      }
    });
  });

  const overallCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Format top 5 recent projects
  const recentProjects: RecentProjectItem[] = projects.slice(0, 5).map((p) => {
    const pTotal = p.tasks.length;
    const pCompleted = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const progressPercentage =
      pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      key: p.key,
      status: p.status,
      updatedAt: p.updatedAt,
      taskCount: pTotal,
      completedTaskCount: pCompleted,
      progressPercentage,
    };
  });

  // 3. Fetch top 5 recent tasks
  const recentTasksData = await prisma.task.findMany({
    where: {
      project: accessibleProjectFilter,
    },
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          key: true,
        },
      },
    },
  });

  const recentTasks: RecentTaskItem[] = recentTasksData.map((t) => ({
    id: t.id,
    taskNumber: t.taskNumber,
    taskIdentifier: `${t.project.key}-${t.taskNumber}`,
    title: t.title,
    status: t.status,
    priority: t.priority,
    updatedAt: t.updatedAt,
    projectId: t.project.id,
    projectName: t.project.name,
    projectKey: t.project.key,
  }));

  return {
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    overallCompletionRate,
    recentProjects,
    recentTasks,
  };
}
