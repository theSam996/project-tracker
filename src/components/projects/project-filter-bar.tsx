"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";

const STATUS_TABS = [
  { label: "Active", value: "" }, // Default active view (hides archived)
  { label: "All", value: "ALL" },
  { label: "Planning", value: "PLANNING" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

const SORT_OPTIONS = [
  { label: "Recently Created", value: "createdAt" },
  { label: "Project Name", value: "name" },
  { label: "Target Date", value: "targetDate" },
  { label: "Status", value: "status" },
];

export function ProjectFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "";
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "createdAt";

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

  return (
    <div className="space-y-4">
      {/* Top row: Search input & Sort dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={currentQuery}
              key={currentQuery}
              placeholder="Search by project name or key..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
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

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sort:</span>
          </div>
          <select
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="text-xs sm:text-sm font-medium py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom row: Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {STATUS_TABS.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => updateFilters({ status: tab.value || null })}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
