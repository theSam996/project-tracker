import { prisma } from "@/lib/prisma";
import { ProjectStatus, TaskStatus, ProjectMemberRole } from "@prisma/client";

export interface ProjectListItem {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  isOwner: boolean;
  userRole: ProjectMemberRole;
  taskCount: number;
  completedTaskCount: number;
  progressPercentage: number;
  memberCount: number;
}

export interface GetProjectsParams {
  userId: string;
  status?: string;
  q?: string;
  sort?: string;
}

/**
 * Fetch projects accessible by user with filtering, search, and sorting
 */
export async function getProjects({
  userId,
  status,
  q,
  sort,
}: GetProjectsParams): Promise<ProjectListItem[]> {
  // Base access filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    OR: [
      { userId },
      { members: { some: { userId } } },
    ],
  };

  // Status filtering
  if (status && status !== "ALL") {
    if (Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      where.status = status as ProjectStatus;
    }
  } else if (!status) {
    // Default: exclude archived projects from the active view
    where.status = { not: ProjectStatus.ARCHIVED };
  }

  // Search filtering (by name or key)
  if (q && q.trim().length > 0) {
    const searchTerm = q.trim();
    where.AND = [
      {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { key: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
    ];
  }

  // Sorting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = { createdAt: "desc" };
  if (sort === "name") {
    orderBy = { name: "asc" };
  } else if (sort === "targetDate") {
    orderBy = { targetDate: "asc" };
  } else if (sort === "status") {
    orderBy = { status: "asc" };
  } else if (sort === "createdAt") {
    orderBy = { createdAt: "desc" };
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      members: {
        where: { userId },
        select: { role: true },
      },
      _count: {
        select: {
          members: true,
          tasks: true,
        },
      },
      tasks: {
        select: { status: true },
      },
    },
  });

  return projects.map((p) => {
    const isOwner = p.userId === userId;
    const userRole = isOwner
      ? ProjectMemberRole.OWNER
      : p.members[0]?.role || ProjectMemberRole.VIEWER;

    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      key: p.key,
      description: p.description,
      status: p.status,
      startDate: p.startDate,
      targetDate: p.targetDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      userId: p.userId,
      owner: p.user,
      isOwner,
      userRole,
      taskCount: totalTasks,
      completedTaskCount: completedTasks,
      progressPercentage,
      memberCount: p._count.members,
    };
  });
}

export interface ProjectDetail {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  isOwner: boolean;
  userRole: ProjectMemberRole;
  taskCount: number;
  completedTaskCount: number;
  progressPercentage: number;
  members: {
    id: string;
    role: ProjectMemberRole;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }[];
}

/**
 * Fetch a single project by ID with authorization and computed metrics
 */
export async function getProjectById(
  projectId: string,
  userId: string
): Promise<ProjectDetail | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      tasks: {
        select: { status: true },
      },
    },
  });

  if (!project) {
    return null;
  }

  const isOwner = project.userId === userId;
  const memberRecord = project.members.find((m) => m.user.id === userId);

  // If user is neither owner nor a registered member, deny access
  if (!isOwner && !memberRecord) {
    return null;
  }

  const userRole = isOwner
    ? ProjectMemberRole.OWNER
    : memberRecord?.role || ProjectMemberRole.VIEWER;

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === TaskStatus.DONE).length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    id: project.id,
    name: project.name,
    key: project.key,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    targetDate: project.targetDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    userId: project.userId,
    owner: project.user,
    isOwner,
    userRole,
    taskCount: totalTasks,
    completedTaskCount: completedTasks,
    progressPercentage,
    members: project.members.map((m) => ({
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    })),
  };
}
