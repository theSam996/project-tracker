"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getProjectAccess } from "@/lib/project-auth";
import { ProjectMemberRole } from "@prisma/client";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  MoveTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type MoveTaskInput,
} from "@/lib/validations/task";

export interface TaskActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Server Action: Create a new task within a project
 */
export async function createTask(
  projectId: string,
  input: CreateTaskInput
): Promise<TaskActionResult<{ id: string; taskNumber: number; title: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const access = await getProjectAccess(projectId, user.id);
  if (!access.hasAccess || access.role === ProjectMemberRole.VIEWER) {
    return {
      success: false,
      error: "Unauthorized. Viewers cannot create tasks in this project.",
    };
  }

  const validation = CreateTaskSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid task data.",
    };
  }

  const { title, description, status, priority, assigneeId, dueDate } = validation.data;

  try {
    // If assignee is assigned, ensure assignee belongs to the project
    if (assigneeId) {
      const isAssigneeAllowed =
        assigneeId === access.project?.userId ||
        (await prisma.projectMember.findFirst({
          where: { projectId, userId: assigneeId },
        }));

      if (!isAssigneeAllowed) {
        return {
          success: false,
          error: "Assignee must be a member of this project.",
        };
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      // 1. Calculate next sequential task number within this project
      const maxTaskNumberResult = await tx.task.aggregate({
        where: { projectId },
        _max: { taskNumber: true },
      });
      const nextTaskNumber = (maxTaskNumberResult._max.taskNumber ?? 0) + 1;

      // 2. Calculate next order position in the target status column
      const maxOrderResult = await tx.task.aggregate({
        where: { projectId, status },
        _max: { order: true },
      });
      const nextOrder = (maxOrderResult._max.order ?? 0) + 1;

      // 3. Create the task
      return tx.task.create({
        data: {
          title,
          description,
          status,
          priority,
          dueDate,
          order: nextOrder,
          taskNumber: nextTaskNumber,
          projectId,
          userId: assigneeId || null,
          creatorId: user.id,
        },
      });
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/board`);
    revalidatePath(`/projects/${projectId}/list`);

    return {
      success: true,
      data: {
        id: task.id,
        taskNumber: task.taskNumber,
        title: task.title,
      },
    };
  } catch (error) {
    console.error("Create task error:", error);
    return {
      success: false,
      error: "Failed to create task. Please try again.",
    };
  }
}

/**
 * Server Action: Update an existing task
 */
export async function updateTask(
  projectId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<TaskActionResult<{ id: string; taskNumber: number }>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const access = await getProjectAccess(projectId, user.id);
  if (!access.hasAccess || access.role === ProjectMemberRole.VIEWER) {
    return {
      success: false,
      error: "Unauthorized. Viewers cannot edit tasks.",
    };
  }

  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!existingTask || existingTask.projectId !== projectId) {
    return {
      success: false,
      error: "Task not found in this project.",
    };
  }

  const validation = UpdateTaskSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid task data.",
    };
  }

  const { title, description, status, priority, assigneeId, dueDate } = validation.data;

  try {
    if (assigneeId) {
      const isAssigneeAllowed =
        assigneeId === access.project?.userId ||
        (await prisma.projectMember.findFirst({
          where: { projectId, userId: assigneeId },
        }));

      if (!isAssigneeAllowed) {
        return {
          success: false,
          error: "Assignee must be a member of this project.",
        };
      }
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      let order = existingTask.order;

      // If status changed, place at the end of the new status column
      if (status !== existingTask.status) {
        const maxOrderResult = await tx.task.aggregate({
          where: { projectId, status },
          _max: { order: true },
        });
        order = (maxOrderResult._max.order ?? 0) + 1;
      }

      return tx.task.update({
        where: { id: taskId },
        data: {
          title,
          description,
          status,
          priority,
          dueDate,
          order,
          userId: assigneeId || null,
        },
      });
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/board`);
    revalidatePath(`/projects/${projectId}/list`);
    revalidatePath(`/projects/${projectId}/tasks/${taskId}`);

    return {
      success: true,
      data: {
        id: updatedTask.id,
        taskNumber: updatedTask.taskNumber,
      },
    };
  } catch (error) {
    console.error("Update task error:", error);
    return {
      success: false,
      error: "Failed to update task. Please try again.",
    };
  }
}

/**
 * Server Action: Move a task in Kanban (status and/or order update)
 */
export async function moveTask(
  projectId: string,
  input: MoveTaskInput
): Promise<TaskActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const access = await getProjectAccess(projectId, user.id);
  if (!access.hasAccess || access.role === ProjectMemberRole.VIEWER) {
    return {
      success: false,
      error: "Unauthorized. Viewers cannot move tasks.",
    };
  }

  const validation = MoveTaskSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid move data.",
    };
  }

  const { taskId, status, order } = validation.data;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask || existingTask.projectId !== projectId) {
      return {
        success: false,
        error: "Task not found in this project.",
      };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        order,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/board`);
    revalidatePath(`/projects/${projectId}/list`);

    return {
      success: true,
      data: { id: taskId },
    };
  } catch (error) {
    console.error("Move task error:", error);
    return {
      success: false,
      error: "Failed to move task. Please try again.",
    };
  }
}

/**
 * Server Action: Delete a task
 */
export async function deleteTask(
  projectId: string,
  taskId: string
): Promise<TaskActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const access = await getProjectAccess(projectId, user.id);
  if (!access.hasAccess) {
    return {
      success: false,
      error: "Unauthorized access to project.",
    };
  }

  // Only project owner or task creator can delete
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task || task.projectId !== projectId) {
    return {
      success: false,
      error: "Task not found in this project.",
    };
  }

  const isOwner = access.isOwner;
  const isCreator = task.creatorId === user.id;

  if (!isOwner && !isCreator) {
    return {
      success: false,
      error: "Unauthorized. Only the project owner or task creator can delete this task.",
    };
  }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/board`);
    revalidatePath(`/projects/${projectId}/list`);

    return { success: true };
  } catch (error) {
    console.error("Delete task error:", error);
    return {
      success: false,
      error: "Failed to delete task. Please try again.",
    };
  }
}
