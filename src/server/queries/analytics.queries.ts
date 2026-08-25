import { prisma } from "@/lib/prisma";
import { getProjectAccess } from "@/lib/project-auth";
import { TaskStatus, TaskPriority, ProjectMemberRole } from "@prisma/client";

export interface AssigneeAnalytics {
  id: string;
  name: string | null;
  email: string;
  taskCount: number;
  completedCount: number;
}

export interface OverdueTaskItem {
  id: string;
  taskIdentifier: string;
  title: string;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface ProjectAnalyticsData {
  project: {
    id: string;
    name: string;
    key: string;
  };
  userRole: ProjectMemberRole;
  isOwner: boolean;
  totalTasks: number;
  completedTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  overdueTasksCount: number;
  completionPercentage: number;
  statusBreakdown: {
    status: TaskStatus;
    label: string;
    count: number;
    percentage: number;
  }[];
  priorityBreakdown: {
    priority: TaskPriority;
    label: string;
    count: number;
    percentage: number;
  }[];
  assigneeBreakdown: AssigneeAnalytics[];
  unassignedCount: number;
  overdueTasks: OverdueTaskItem[];
}

/**
 * Fetch authoritative project analytics metrics from database
 */
export async function getProjectAnalytics(
  projectId: string,
  userId: string
): Promise<ProjectAnalyticsData | null> {
  const access = await getProjectAccess(projectId, userId);
  if (!access.hasAccess || !access.project || !access.role) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { dueDate: "asc" },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const nowTime = new Date().setHours(0, 0, 0, 0);

  const totalTasks = tasks.length;
  let completedTasks = 0;
  let todoTasks = 0;
  let inProgressTasks = 0;
  let inReviewTasks = 0;

  const priorityCounts: Record<TaskPriority, number> = {
    [TaskPriority.LOW]: 0,
    [TaskPriority.MEDIUM]: 0,
    [TaskPriority.HIGH]: 0,
    [TaskPriority.URGENT]: 0,
  };

  const assigneeMap = new Map<string, AssigneeAnalytics>();
  let unassignedCount = 0;
  const overdueTasksList: OverdueTaskItem[] = [];

  tasks.forEach((t) => {
    // Status counts
    if (t.status === TaskStatus.DONE) {
      completedTasks++;
    } else if (t.status === TaskStatus.TODO) {
      todoTasks++;
    } else if (t.status === TaskStatus.IN_PROGRESS) {
      inProgressTasks++;
    } else if (t.status === TaskStatus.IN_REVIEW) {
      inReviewTasks++;
    }

    // Priority counts
    if (priorityCounts[t.priority] !== undefined) {
      priorityCounts[t.priority]++;
    }

    // Overdue check
    if (t.dueDate && t.status !== TaskStatus.DONE) {
      if (new Date(t.dueDate).getTime() < nowTime) {
        overdueTasksList.push({
          id: t.id,
          taskIdentifier: `${access.project!.key}-${t.taskNumber}`,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
        });
      }
    }

    // Assignee aggregation
    if (t.assignee) {
      const existing = assigneeMap.get(t.assignee.id);
      if (existing) {
        existing.taskCount++;
        if (t.status === TaskStatus.DONE) {
          existing.completedCount++;
        }
      } else {
        assigneeMap.set(t.assignee.id, {
          id: t.assignee.id,
          name: t.assignee.name,
          email: t.assignee.email,
          taskCount: 1,
          completedCount: t.status === TaskStatus.DONE ? 1 : 0,
        });
      }
    } else {
      unassignedCount++;
    }
  });

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusBreakdown = [
    {
      status: TaskStatus.TODO,
      label: "To Do",
      count: todoTasks,
      percentage: totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0,
    },
    {
      status: TaskStatus.IN_PROGRESS,
      label: "In Progress",
      count: inProgressTasks,
      percentage: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0,
    },
    {
      status: TaskStatus.IN_REVIEW,
      label: "In Review",
      count: inReviewTasks,
      percentage: totalTasks > 0 ? Math.round((inReviewTasks / totalTasks) * 100) : 0,
    },
    {
      status: TaskStatus.DONE,
      label: "Done",
      count: completedTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
  ];

  const priorityBreakdown = [
    {
      priority: TaskPriority.LOW,
      label: "Low",
      count: priorityCounts[TaskPriority.LOW],
      percentage:
        totalTasks > 0
          ? Math.round((priorityCounts[TaskPriority.LOW] / totalTasks) * 100)
          : 0,
    },
    {
      priority: TaskPriority.MEDIUM,
      label: "Medium",
      count: priorityCounts[TaskPriority.MEDIUM],
      percentage:
        totalTasks > 0
          ? Math.round((priorityCounts[TaskPriority.MEDIUM] / totalTasks) * 100)
          : 0,
    },
    {
      priority: TaskPriority.HIGH,
      label: "High",
      count: priorityCounts[TaskPriority.HIGH],
      percentage:
        totalTasks > 0
          ? Math.round((priorityCounts[TaskPriority.HIGH] / totalTasks) * 100)
          : 0,
    },
    {
      priority: TaskPriority.URGENT,
      label: "Urgent",
      count: priorityCounts[TaskPriority.URGENT],
      percentage:
        totalTasks > 0
          ? Math.round((priorityCounts[TaskPriority.URGENT] / totalTasks) * 100)
          : 0,
    },
  ];

  return {
    project: access.project,
    userRole: access.role,
    isOwner: access.isOwner,
    totalTasks,
    completedTasks,
    todoTasks,
    inProgressTasks,
    inReviewTasks,
    overdueTasksCount: overdueTasksList.length,
    completionPercentage,
    statusBreakdown,
    priorityBreakdown,
    assigneeBreakdown: Array.from(assigneeMap.values()).sort(
      (a, b) => b.taskCount - a.taskCount
    ),
    unassignedCount,
    overdueTasks: overdueTasksList,
  };
}
