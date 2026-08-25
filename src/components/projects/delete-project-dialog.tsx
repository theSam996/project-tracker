"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/server/actions/project.actions";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  projectKey: string;
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  projectKey,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState("");

  const handleOpen = () => {
    setConfirmInput("");
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setIsOpen(false);
      setConfirmInput("");
      setError(null);
    }
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (!result.success) {
        setError(result.error || "Failed to delete project.");
      } else {
        setIsOpen(false);
        router.push("/projects");
      }
    });
  };

  const isConfirmed = confirmInput.trim().toUpperCase() === projectKey.toUpperCase();

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete Project</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      id="delete-dialog-title"
                      className="text-base font-bold text-slate-900 dark:text-slate-100"
                    >
                      Delete Project
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isPending}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 space-y-1">
                <p className="font-semibold">Destructive Action:</p>
                <p>
                  Deleting <strong className="font-bold">{projectName}</strong> will permanently remove all associated member roles and tasks.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Please type <span className="font-mono font-bold text-red-600 dark:text-red-400">{projectKey}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={`Type "${projectKey}" here`}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono uppercase"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              )}

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
                  type="button"
                  onClick={handleDelete}
                  disabled={!isConfirmed || isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Permanently Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
