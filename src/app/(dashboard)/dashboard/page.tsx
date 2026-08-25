import React from "react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  FolderKanban,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { ProjectStatus } from "@prisma/client";

export const metadata = {
  title: "Dashboard - Project Tracker",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const projectCount = user
    ? await prisma.project.count({
        where: {
          OR: [{ userId: user.id }, { members: { some: { userId: user.id } } }],
          status: { not: ProjectStatus.ARCHIVED },
        },
      })
    : 0;

  const metrics = [
    {
      title: "Total Projects",
      value: projectCount.toString(),
      description: "Active workspaces",
      icon: FolderKanban,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Total Tasks",
      value: "0",
      description: "Across all projects",
      icon: ListTodo,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      title: "Completed Tasks",
      value: "0",
      description: "Finished deliverables",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Overdue Tasks",
      value: "0",
      description: "Needs attention",
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Phase 2 Authenticated Shell</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, {user?.name || "Member"}!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Here is a snapshot of your project activities and progress.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.title}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {metric.title}
                </span>
                <div className={`p-2 rounded-xl ${metric.bg} ${metric.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {metric.value}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Phase Roadmap Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Authentication & Application Shell Foundation Ready
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Session management, route protection, and navigation layout are actively running.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              ✅ Secure Authentication
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Bcrypt password hashing and encrypted HTTP-only session cookies.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              ✅ Middleware Route Guard
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Automatic redirection for protected paths and authenticated visits.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              ⏳ Phase 3 Up Next
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Project creation, project list, and member collaboration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
