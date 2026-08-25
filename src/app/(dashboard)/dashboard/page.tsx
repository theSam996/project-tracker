import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDashboardAnalytics } from "@/server/queries/dashboard.queries";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import {
  FolderKanban,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Dashboard - Project Tracker",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardAnalytics(user.id);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const metrics = [
    {
      title: "Total Projects",
      value: data.totalProjects.toString(),
      description: `${data.activeProjects} active workspaces`,
      icon: FolderKanban,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Total Tasks",
      value: data.totalTasks.toString(),
      description: "Across all workspaces",
      icon: ListTodo,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      title: "Completed Tasks",
      value: data.completedTasks.toString(),
      description: `${data.overallCompletionRate}% completion rate`,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Overdue Tasks",
      value: data.overdueTasks.toString(),
      description: data.overdueTasks > 0 ? "Require immediate attention" : "All deliverables on schedule",
      icon: AlertTriangle,
      color: data.overdueTasks > 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400",
      bg: data.overdueTasks > 0 ? "bg-red-50 dark:bg-red-950/40" : "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Phase 5 Analytics Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, {user.name || user.email}!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time project activities, delivery health, and workload snapshot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>View Projects</span>
          </Link>
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

      {/* Main Grid: Recent Projects & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Projects
              </h2>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>All projects</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {data.recentProjects.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p>No projects in workspace yet.</p>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create your first project</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {project.key}
                      </span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate"
                      >
                        {project.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{project.taskCount} tasks</span>
                      <span>&bull;</span>
                      <span>{project.progressPercentage}% done</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ProjectStatusBadge status={project.status} />
                    <Link
                      href={`/projects/${project.id}`}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Open project"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Deliverables
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Live updates
            </span>
          </div>

          {data.recentTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No tasks created yet across your workspaces.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {task.taskIdentifier}
                      </span>
                      <Link
                        href={`/projects/${task.projectId}/tasks/${task.id}`}
                        className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-xs"
                      >
                        {task.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>in {task.projectName}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(task.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <TaskPriorityBadge priority={task.priority} showIcon={false} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
