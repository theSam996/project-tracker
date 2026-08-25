"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveProject } from "@/server/actions/project.actions";
import { Archive, Loader2 } from "lucide-react";

interface ArchiveProjectButtonProps {
  projectId: string;
  isArchived: boolean;
}

export function ArchiveProjectButton({
  projectId,
  isArchived,
}: ArchiveProjectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (confirm("Are you sure you want to archive this project? It will be hidden from the active view.")) {
      startTransition(async () => {
        const result = await archiveProject(projectId);
        if (result.success) {
          router.refresh();
        } else {
          alert(result.error || "Failed to archive project.");
        }
      });
    }
  };

  if (isArchived) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
        <Archive className="h-3.5 w-3.5" />
        <span>Archived</span>
      </span>
    );
  }

  return (
    <button
      onClick={handleArchive}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Archiving...</span>
        </>
      ) : (
        <>
          <Archive className="h-3.5 w-3.5" />
          <span>Archive Project</span>
        </>
      )}
    </button>
  );
}
