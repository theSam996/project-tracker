"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectMemberRole } from "@prisma/client";
import { removeProjectMember, updateProjectMemberRole } from "@/server/actions/member.actions";
import { Shield, Trash2, Loader2, User } from "lucide-react";

interface MemberItem {
  id: string;
  role: ProjectMemberRole;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface MemberListProps {
  projectId: string;
  isOwner: boolean;
  currentUserId: string;
  members: MemberItem[];
}

export function MemberList({
  projectId,
  isOwner,
  currentUserId,
  members,
}: MemberListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const getInitials = (name: string | null, email: string) => {
    if (name && name.trim().length > 0) {
      return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleRoleChange = (
    memberId: string,
    newRole: typeof ProjectMemberRole.MEMBER | typeof ProjectMemberRole.VIEWER
  ) => {
    startTransition(async () => {
      const result = await updateProjectMemberRole(projectId, {
        memberId,
        role: newRole,
      });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to update member role.");
      }
    });
  };

  const handleRemoveMember = (memberId: string, memberEmail: string) => {
    if (confirm(`Are you sure you want to remove ${memberEmail} from this project?`)) {
      startTransition(async () => {
        const result = await removeProjectMember(projectId, memberId);
        if (result.success) {
          router.refresh();
        } else {
          alert(result.error || "Failed to remove member.");
        }
      });
    }
  };

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {members.map((member) => {
        const isMemberOwner = member.role === ProjectMemberRole.OWNER;
        const isSelf = member.user.id === currentUserId;

        return (
          <div
            key={member.id}
            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
                {getInitials(member.user.name, member.user.email)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {member.user.name || "Unnamed User"}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                      You
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                  {member.user.email}
                </span>
              </div>
            </div>

            {/* Role & Actions */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              {isMemberOwner ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                  <Shield className="h-3 w-3" />
                  Owner
                </span>
              ) : isOwner ? (
                <div className="flex items-center gap-2">
                  <select
                    disabled={isPending}
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(
                        member.id,
                        e.target.value as typeof ProjectMemberRole.MEMBER | typeof ProjectMemberRole.VIEWER
                      )
                    }
                    className="text-xs font-medium py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value={ProjectMemberRole.MEMBER}>Member</option>
                    <option value={ProjectMemberRole.VIEWER}>Viewer</option>
                  </select>

                  <button
                    onClick={() => handleRemoveMember(member.id, member.user.email)}
                    disabled={isPending}
                    className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <User className="h-3 w-3" />
                  {member.role}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {isPending && (
        <div className="py-2 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Updating membership...</span>
        </div>
      )}
    </div>
  );
}
