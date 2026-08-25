"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectMemberRole } from "@prisma/client";
import { addProjectMember } from "@/server/actions/member.actions";
import { UserPlus, X, Loader2, AlertCircle } from "lucide-react";

interface AddMemberDialogProps {
  projectId: string;
}

export function AddMemberDialog({ projectId }: AddMemberDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectMemberRole>(ProjectMemberRole.MEMBER);

  const handleOpen = () => {
    setEmail("");
    setRole(ProjectMemberRole.MEMBER);
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setIsOpen(false);
      setEmail("");
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    startTransition(async () => {
      const result = await addProjectMember(projectId, {
        email: email.trim().toLowerCase(),
        role: role === ProjectMemberRole.VIEWER ? ProjectMemberRole.VIEWER : ProjectMemberRole.MEMBER,
      });

      if (!result.success) {
        setError(result.error || "Failed to add member.");
      } else {
        setIsOpen(false);
        setEmail("");
        router.refresh();
      }
    });
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
      >
        <UserPlus className="h-4 w-4" />
        <span>Add Member</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-member-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h2
                  id="add-member-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  Add Project Member
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isPending}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  User Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Must be an existing registered user in the application.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProjectMemberRole)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value={ProjectMemberRole.MEMBER}>Member (View & Collaborate)</option>
                  <option value={ProjectMemberRole.VIEWER}>Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add to Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
