import { prisma } from "@/lib/prisma";
import { ProjectStatus, TaskStatus, TaskPriority } from "@prisma/client";

export interface GlobalProjectResult {
  id: string;
  name: string;
  key: string;
  status: ProjectStatus;
}

export interface GlobalTaskResult {
  id: string;
  taskNumber: number;
  taskIdentifier: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  projectKey: string;
}

export interface GlobalSearchResults {
  projects: GlobalProjectResult[];
  tasks: GlobalTaskResult[];
}

/**
 * Server-side Global Search across accessible Projects and Tasks
 */
export async function globalSearch(
  userId: string,
  query: string
): Promise<GlobalSearchResults> {
  const q = query?.trim();
  if (!userId || !q || q.length === 0) {
    return { projects: [], tasks: [] };
  }

  const numberMatch = q.match(/^(?:[a-zA-Z0-9]+-)?(\d+)$/);
  const parsedNumber = numberMatch ? parseInt(numberMatch[1], 10) : null;

  // 1. Search Accessible Projects
  const projectsPromise = prisma.project.findMany({
    where: {
      OR: [{ userId }, { members: { some: { userId } } }],
      AND: [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { key: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      key: true,
      status: true,
    },
  });

  // 2. Search Accessible Tasks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskSearchConditions: any[] = [
    { title: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ];

  if (parsedNumber !== null && !isNaN(parsedNumber)) {
    taskSearchConditions.push({ taskNumber: parsedNumber });
  }

  const tasksPromise = prisma.task.findMany({
    where: {
      project: {
        OR: [{ userId }, { members: { some: { userId } } }],
      },
      OR: taskSearchConditions,
    },
    take: 12,
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

  const [projects, tasks] = await Promise.all([projectsPromise, tasksPromise]);

  return {
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      status: p.status,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      taskNumber: t.taskNumber,
      taskIdentifier: `${t.project.key}-${t.taskNumber}`,
      title: t.title,
      status: t.status,
      priority: t.priority,
      projectId: t.project.id,
      projectName: t.project.name,
      projectKey: t.project.key,
    })),
  };
}
