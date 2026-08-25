"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getProjectAccess } from "@/lib/project-auth";
import { ProjectStatus, ProjectMemberRole } from "@prisma/client";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validations/project";

export interface ProjectActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Server Action: Create a new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<ProjectActionResult<{ id: string; name: string; key: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const validation = CreateProjectSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid project data.",
    };
  }

  const { name, key, description, status, startDate, targetDate } = validation.data;

  try {
    // Check if key already exists for this owner
    const existingKey = await prisma.project.findFirst({
      where: {
        userId: user.id,
        key: { equals: key, mode: "insensitive" },
      },
    });

    if (existingKey) {
      return {
        success: false,
        error: `A project with key "${key}" already exists in your workspace.`,
      };
    }

    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name,
          key,
          description,
          status,
          startDate,
          targetDate,
          userId: user.id,
        },
      });

      // Add owner to members table for consistent membership queries
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: user.id,
          role: ProjectMemberRole.OWNER,
        },
      });

      return newProject;
    });

    revalidatePath("/projects");
    return {
      success: true,
      data: {
        id: project.id,
        name: project.name,
        key: project.key,
      },
    };
  } catch (error) {
    console.error("Create project error:", error);
    return {
      success: false,
      error: "Failed to create project. Please try again.",
    };
  }
}

/**
 * Server Action: Update an existing project
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<ProjectActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const access = await getProjectAccess(projectId, user.id);
  if (!access.hasAccess || !access.isOwner) {
    return {
      success: false,
      error: "Unauthorized. Only the project owner can edit project settings.",
    };
  }

  const validation = UpdateProjectSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid project data.",
    };
  }

  const { name, key, description, status, startDate, targetDate } = validation.data;

  try {
    // Check if new key conflicts with another project owned by this user
    const existingKey = await prisma.project.findFirst({
      where: {
        userId: user.id,
        key: { equals: key, mode: "insensitive" },
        id: { not: projectId },
      },
    });

    if (existingKey) {
      return {
        success: false,
        error: `Another project with key "${key}" already exists in your workspace.`,
      };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        key,
        description,
        status,
        startDate,
        targetDate,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/settings`);

    return {
      success: true,
      data: { id: projectId },
    };
  } catch (error) {
    console.error("Update project error:", error);
    return {
      success: false,
      error: "Failed to update project. Please try again.",
    };
  }
}

/**
 * Server Action: Archive a project (soft status update)
 */
export async function archiveProject(
  projectId: string
): Promise<ProjectActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const access = await getProjectAccess(projectId, user.id);
  if (!access.hasAccess || !access.isOwner) {
    return {
      success: false,
      error: "Unauthorized. Only the project owner can archive this project.",
    };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.ARCHIVED,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Archive project error:", error);
    return {
      success: false,
      error: "Failed to archive project. Please try again.",
    };
  }
}

/**
 * Server Action: Permanently delete a project
 */
export async function deleteProject(
  projectId: string
): Promise<ProjectActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const access = await getProjectAccess(projectId, user.id);
  if (!access.hasAccess || !access.isOwner) {
    return {
      success: false,
      error: "Unauthorized. Only the project owner can delete this project.",
    };
  }

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/projects");

    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return {
      success: false,
      error: "Failed to delete project. Please try again.",
    };
  }
}
