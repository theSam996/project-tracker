"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface TaskFiltersProps {
  members: { id: string; name: string | null; email: string }[];
}

export function TaskFilters({ members }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") || "";
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    updateFilters({ q: q?.trim() || null });
  };

  const handleClearSearch = () => {
    updateFilters({ q: null });
  };

  const hasActiveFilters = currentQuery || currentStatus || currentPriority || currentAssignee || currentSort;

  const handleResetFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Top Search Bar & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={currentQuery}
              key={currentQuery}
              placeholder="Search tasks by identifier, title, or description..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
            {currentQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Sort */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Sort:
          </label>
          <select
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value || null })}
            className="text-xs sm:text-sm font-medium py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="">Default Order</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="createdAt">Recently Created</option>
          </select>
        </div>
      </div>

      {/* Filter Selectors Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
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

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset All</span>
          </button>
        )}
      </div>
    </div>
  );
}
