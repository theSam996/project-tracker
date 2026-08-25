import { prisma } from "@/lib/prisma";
import { getProjectAccess } from "@/lib/project-auth";
import { TaskStatus, TaskPriority, ProjectMemberRole } from "@prisma/client";

export interface TaskItem {
  id: string;
  taskNumber: number;
  taskIdentifier: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  order: number;
  projectId: string;
  projectKey: string;
  projectName: string;
  createdAt: Date;
  updatedAt: Date;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  creator: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface GetProjectTasksParams {
  projectId: string;
  userId: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  sort?: string;
}

export async function getProjectTasks({
  projectId,
  userId,
  status,
  priority,
  assigneeId,
  sort,
}: GetProjectTasksParams): Promise<{
  tasks: TaskItem[];
  project: { id: string; name: string; key: string };
  userRole: ProjectMemberRole;
  isOwner: boolean;
} | null> {
  const access = await getProjectAccess(projectId, userId);
  if (!access.hasAccess || !access.project || !access.role) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { projectId };

  if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
    where.status = status as TaskStatus;
  }

  if (priority && Object.values(TaskPriority).includes(priority as TaskPriority)) {
    where.priority = priority as TaskPriority;
  }

  if (assigneeId) {
    if (assigneeId === "unassigned") {
      where.userId = null;
    } else {
      where.userId = assigneeId;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = [{ order: "asc" }, { createdAt: "asc" }];
  if (sort === "dueDate") {
    orderBy = [{ dueDate: "asc" }, { createdAt: "asc" }];
  } else if (sort === "priority") {
    orderBy = [{ priority: "desc" }, { createdAt: "asc" }];
  } else if (sort === "status") {
    orderBy = [{ status: "asc" }, { order: "asc" }];
  } else if (sort === "createdAt") {
    orderBy = [{ createdAt: "desc" }];
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  return {
    project: access.project,
    userRole: access.role,
    isOwner: access.isOwner,
    tasks: tasks.map((t) => ({
      id: t.id,
      taskNumber: t.taskNumber,
      taskIdentifier: `${t.project.key}-${t.taskNumber}`,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      order: t.order,
      projectId: t.projectId,
      projectKey: t.project.key,
      projectName: t.project.name,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      assignee: t.assignee,
      creator: t.creator,
    })),
  };
}

export async function getKanbanTasks(
  projectId: string,
  userId: string
): Promise<{
  columns: Record<TaskStatus, TaskItem[]>;
  project: { id: string; name: string; key: string };
  members: { id: string; name: string | null; email: string }[];
  userRole: ProjectMemberRole;
  isOwner: boolean;
} | null> {
  const access = await getProjectAccess(projectId, userId);
  if (!access.hasAccess || !access.project || !access.role) {
    return null;
  }

  const [tasks, membersData, projectOwner] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: access.project.userId },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const columns: Record<TaskStatus, TaskItem[]> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.IN_REVIEW]: [],
    [TaskStatus.DONE]: [],
  };

  tasks.forEach((t) => {
    const item: TaskItem = {
      id: t.id,
      taskNumber: t.taskNumber,
      taskIdentifier: `${t.project.key}-${t.taskNumber}`,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      order: t.order,
      projectId: t.projectId,
      projectKey: t.project.key,
      projectName: t.project.name,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      assignee: t.assignee,
      creator: t.creator,
    };
    if (columns[t.status]) {
      columns[t.status].push(item);
    }
  });

  // Unique list of project members and owner
  const membersMap = new Map<string, { id: string; name: string | null; email: string }>();
  if (projectOwner) {
    membersMap.set(projectOwner.id, projectOwner);
  }
  membersData.forEach((m) => {
    membersMap.set(m.user.id, m.user);
  });

  return {
    columns,
    project: access.project,
    members: Array.from(membersMap.values()),
    userRole: access.role,
    isOwner: access.isOwner,
  };
}

export async function getTaskById(
  projectId: string,
  taskId: string,
  userId: string
): Promise<{
  task: TaskItem;
  project: { id: string; name: string; key: string };
  members: { id: string; name: string | null; email: string }[];
  canEdit: boolean;
  canDelete: boolean;
  userRole: ProjectMemberRole;
} | null> {
  const access = await getProjectAccess(projectId, userId);
  if (!access.hasAccess || !access.project || !access.role) {
    return null;
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  if (!task || task.projectId !== projectId) {
    return null;
  }

  const [membersData, projectOwner] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: access.project.userId },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const membersMap = new Map<string, { id: string; name: string | null; email: string }>();
  if (projectOwner) {
    membersMap.set(projectOwner.id, projectOwner);
  }
  membersData.forEach((m) => {
    membersMap.set(m.user.id, m.user);
  });

  const canEdit = access.role !== ProjectMemberRole.VIEWER;
  const canDelete = access.isOwner || task.creatorId === userId;

  return {
    project: access.project,
    userRole: access.role,
    canEdit,
    canDelete,
    members: Array.from(membersMap.values()),
    task: {
      id: task.id,
      taskNumber: task.taskNumber,
      taskIdentifier: `${task.project.key}-${task.taskNumber}`,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      order: task.order,
      projectId: task.projectId,
      projectKey: task.project.key,
      projectName: task.project.name,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignee: task.assignee,
      creator: task.creator,
    },
  };
}
