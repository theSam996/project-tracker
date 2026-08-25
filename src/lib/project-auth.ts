import { prisma } from "@/lib/prisma";
import { ProjectMemberRole } from "@prisma/client";

export interface ProjectAccessResult {
  hasAccess: boolean;
  role: ProjectMemberRole | null;
  isOwner: boolean;
  project: {
    id: string;
    name: string;
    key: string;
    userId: string;
  } | null;
}

/**
 * Determine a user's role and permissions for a given project
 */
export async function getProjectAccess(
  projectId: string,
  userId: string
): Promise<ProjectAccessResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      key: true,
      userId: true,
      members: {
        where: { userId },
        select: {
          role: true,
        },
      },
    },
  });

  if (!project) {
    return {
      hasAccess: false,
      role: null,
      isOwner: false,
      project: null,
    };
  }

  // Direct owner
  if (project.userId === userId) {
    return {
      hasAccess: true,
      role: ProjectMemberRole.OWNER,
      isOwner: true,
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        userId: project.userId,
      },
    };
  }

  // Member or Viewer via ProjectMember relation
  const memberRecord = project.members[0];
  if (memberRecord) {
    return {
      hasAccess: true,
      role: memberRecord.role,
      isOwner: memberRecord.role === ProjectMemberRole.OWNER,
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        userId: project.userId,
      },
    };
  }

  return {
    hasAccess: false,
    role: null,
    isOwner: false,
    project: null,
  };
}
