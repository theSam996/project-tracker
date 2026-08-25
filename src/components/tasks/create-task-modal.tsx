"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { createTask } from "@/server/actions/task.actions";
import { Plus, X, Loader2, AlertCircle, CheckSquare } from "lucide-react";

interface CreateTaskModalProps {
  projectId: string;
  members: { id: string; name: string | null; email: string }[];
  initialStatus?: TaskStatus;
  buttonLabel?: string;
  className?: string;
}

export function CreateTaskModal({
  projectId,
  members,
  initialStatus = TaskStatus.TODO,
  buttonLabel = "New Task",
  className = "",
}: CreateTaskModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus(initialStatus);
    setPriority(TaskPriority.MEDIUM);
    setAssigneeId("");
    setDueDate("");
    setError(null);
  };

  const handleOpen = () => {
    resetForm();
    setStatus(initialStatus);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setIsOpen(false);
      resetForm();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    startTransition(async () => {
      const result = await createTask(projectId, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      });

      if (!result.success) {
        setError(result.error || "Failed to create task.");
      } else {
        setIsOpen(false);
        resetForm();
        router.refresh();
      }
    });
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer ${className}`}
      >
        <Plus className="h-4 w-4" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-task-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <h2
                  id="create-task-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  Create New Task
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

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement user login API endpoint"
                  maxLength={150}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
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
                  placeholder="Add details, acceptance criteria, or context..."
                  maxLength={2000}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Status & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={TaskStatus.TODO}>To Do</option>
                    <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                    <option value={TaskStatus.IN_REVIEW}>In Review</option>
                    <option value={TaskStatus.DONE}>Done</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={TaskPriority.LOW}>Low</option>
                    <option value={TaskPriority.MEDIUM}>Medium</option>
                    <option value={TaskPriority.HIGH}>High</option>
                    <option value={TaskPriority.URGENT}>Urgent</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Due Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
                    <span>Create Task</span>
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
