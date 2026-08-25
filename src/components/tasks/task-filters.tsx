"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { SlidersHorizontal, X } from "lucide-react";

interface TaskFiltersProps {
  members: { id: string; name: string | null; email: string }[];
}

export function TaskFilters({ members }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "";
  const currentPriority = searchParams.get("priority") || "";
  const currentAssignee = searchParams.get("assignee") || "";
  const currentSort = searchParams.get("sort") || "";

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const hasActiveFilters = currentStatus || currentPriority || currentAssignee || currentSort;

  const handleResetFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Status:
        </label>
        <select
          value={currentStatus}
          onChange={(e) => updateFilters({ status: e.target.value || null })}
          className="text-xs font-medium py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value={TaskStatus.TODO}>To Do</option>
          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={TaskStatus.IN_REVIEW}>In Review</option>
          <option value={TaskStatus.DONE}>Done</option>
        </select>
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Priority:
        </label>
        <select
          value={currentPriority}
          onChange={(e) => updateFilters({ priority: e.target.value || null })}
          className="text-xs font-medium py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="">All Priorities</option>
          <option value={TaskPriority.LOW}>Low</option>
          <option value={TaskPriority.MEDIUM}>Medium</option>
          <option value={TaskPriority.HIGH}>High</option>
          <option value={TaskPriority.URGENT}>Urgent</option>
        </select>
      </div>

      {/* Assignee filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Assignee:
        </label>
        <select
          value={currentAssignee}
          onChange={(e) => updateFilters({ assignee: e.target.value || null })}
          className="text-xs font-medium py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.email}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5 ml-auto">
        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Sort:
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateFilters({ sort: e.target.value || null })}
          className="text-xs font-medium py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="">Default Order</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="createdAt">Recently Created</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={handleResetFilters}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
