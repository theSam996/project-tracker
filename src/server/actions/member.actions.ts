"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getProjectAccess } from "@/lib/project-auth";
import { ProjectMemberRole } from "@prisma/client";
import {
  AddMemberSchema,
  UpdateMemberRoleSchema,
  type AddMemberInput,
  type UpdateMemberRoleInput,
} from "@/lib/validations/member";

export interface MemberActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Server Action: Add a registered user to project by email
 */
export async function addProjectMember(
  projectId: string,
  input: AddMemberInput
): Promise<MemberActionResult<{ id: string }>> {
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
      error: "Unauthorized. Only the project owner can manage project members.",
    };
  }

  const validation = AddMemberSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid member data.",
    };
  }

  const { email, role } = validation.data;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: `No registered user found with email "${email}".`,
      };
    }

    if (targetUser.id === user.id) {
      return {
        success: false,
        error: "You are already the owner of this project.",
      };
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return {
        success: false,
        error: `User "${email}" is already a member of this project.`,
      };
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role,
      },
    });

    revalidatePath(`/projects/${projectId}/settings`);
    return {
      success: true,
      data: { id: newMember.id },
    };
  } catch (error) {
    console.error("Add project member error:", error);
    return {
      success: false,
      error: "Failed to add project member. Please try again.",
    };
  }
}

/**
 * Server Action: Remove a member from a project
 */
export async function removeProjectMember(
  projectId: string,
  memberId: string
): Promise<MemberActionResult<void>> {
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
      error: "Unauthorized. Only the project owner can remove members.",
    };
  }

  try {
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      return {
        success: false,
        error: "Member not found on this project.",
      };
    }

    if (member.role === ProjectMemberRole.OWNER || member.userId === user.id) {
      return {
        success: false,
        error: "Cannot remove the project owner.",
      };
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    revalidatePath(`/projects/${projectId}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Remove project member error:", error);
    return {
      success: false,
      error: "Failed to remove project member. Please try again.",
    };
  }
}

/**
 * Server Action: Update a member's role
 */
export async function updateProjectMemberRole(
  projectId: string,
  input: UpdateMemberRoleInput
): Promise<MemberActionResult<void>> {
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
      error: "Unauthorized. Only the project owner can update member roles.",
    };
  }

  const validation = UpdateMemberRoleSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid role data.",
    };
  }

  const { memberId, role } = validation.data;

  try {
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      return {
        success: false,
        error: "Member not found on this project.",
      };
    }

    if (member.role === ProjectMemberRole.OWNER) {
      return {
        success: false,
        error: "Cannot modify the owner's role.",
      };
    }

    await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
    });

    revalidatePath(`/projects/${projectId}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Update member role error:", error);
    return {
      success: false,
      error: "Failed to update member role. Please try again.",
    };
  }
}
