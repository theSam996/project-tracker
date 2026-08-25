"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectStatus } from "@prisma/client";
import { createProject } from "@/server/actions/project.actions";
import { Plus, X, Loader2, AlertCircle, Sparkles } from "lucide-react";

export function CreateProjectModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const resetForm = () => {
    setName("");
    setKey("");
    setDescription("");
    setStatus(ProjectStatus.PLANNING);
    setStartDate("");
    setTargetDate("");
    setError(null);
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setIsOpen(false);
      resetForm();
    }
  };

  // Auto-generate a suggested key if the user hasn't manually edited it
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    // If key hasn't been set or matches earlier auto-key
    if (!key || key.length <= 4) {
      const generated = newName
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 4)
        .toUpperCase();
      if (generated.length >= 2) {
        setKey(generated);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side quick checks
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!key.trim()) {
      setError("Project key is required.");
      return;
    }
    if (startDate && targetDate && new Date(startDate) > new Date(targetDate)) {
      setError("Start date cannot be after target date.");
      return;
    }

    startTransition(async () => {
      const result = await createProject({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() ? description.trim() : null,
        status,
        startDate: startDate || null,
        targetDate: targetDate || null,
      });

      if (!result.success) {
        setError(result.error || "Failed to create project.");
      } else {
        setIsOpen(false);
        resetForm();
        if (result.data?.id) {
          router.push(`/projects/${result.data.id}`);
        } else {
          router.refresh();
        }
      }
    });
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>New Project</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2
                  id="create-project-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  Create New Project
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isPending}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name & Key Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. Website Redesign"
                    maxLength={100}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    placeholder="e.g. WEB"
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono font-bold uppercase bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline project objectives and scope..."
                  maxLength={1000}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value={ProjectStatus.PLANNING}>Planning</option>
                  <option value={ProjectStatus.ACTIVE}>Active</option>
                  <option value={ProjectStatus.ON_HOLD}>On Hold</option>
                  <option value={ProjectStatus.COMPLETED}>Completed</option>
                  <option value={ProjectStatus.ARCHIVED}>Archived</option>
                </select>
              </div>

              {/* Timeline Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
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
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
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
