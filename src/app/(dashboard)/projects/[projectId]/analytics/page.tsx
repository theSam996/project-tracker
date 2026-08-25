import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getProjectAnalytics } from "@/server/queries/analytics.queries";
import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import {
  ChevronLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  User,
  Calendar,
} from "lucide-react";

interface AnalyticsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateMetadata({ params }: AnalyticsPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Analytics - Project Tracker" };

  const data = await getProjectAnalytics(projectId, user.id);
  if (!data) return { title: "Project Not Found" };

  return {
    title: `Analytics - ${data.project.name} (${data.project.key}) - Project Tracker`,
  };
}

export default async function ProjectAnalyticsPage({ params }: AnalyticsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const data = await getProjectAnalytics(projectId, user.id);

  if (!data) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name && name.trim().length > 0) {
      return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>
        <span>/</span>
        <Link
          href={`/projects/${data.project.id}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[150px]"
        >
          {data.project.name}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-semibold">
          Analytics
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {data.project.key}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Project Analytics
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live delivery metrics, completion rate, and workload distribution.
            </p>
          </div>
        </div>

        <ProjectNavTabs projectId={data.project.id} />
      </div>

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Tasks
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {data.totalTasks}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total project deliverables
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {data.completedTasks}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {data.completionPercentage}% of total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Finished deliverables
          </p>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In Progress
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {data.inProgressTasks}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Actively being worked on
          </p>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overdue
            </span>
            <div
              className={`p-2 rounded-xl ${
                data.overdueTasksCount > 0
                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tracking-tight ${
                data.overdueTasksCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {data.overdueTasksCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {data.overdueTasksCount > 0 ? "Past target deadline" : "All deadlines on schedule"}
          </p>
        </div>
      </div>

      {/* Completion Progress Bar Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Overall Project Completion
            </h3>
          </div>
          <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {data.completionPercentage}%
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(data.completionPercentage, 0)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>{data.completedTasks} completed</span>
          <span>{data.totalTasks - data.completedTasks} remaining</span>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            Tasks by Status
          </h3>

          {data.totalTasks === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No tasks in project</p>
          ) : (
            <div className="space-y-3">
              {data.statusBreakdown.map((item) => (
                <div key={item.status} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.status === "DONE"
                          ? "bg-emerald-500"
                          : item.status === "IN_PROGRESS"
                          ? "bg-blue-500"
                          : item.status === "IN_REVIEW"
                          ? "bg-purple-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            Tasks by Priority
          </h3>

          {data.totalTasks === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No tasks in project</p>
          ) : (
            <div className="space-y-3">
              {data.priorityBreakdown.map((item) => (
                <div key={item.priority} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.priority === "URGENT"
                          ? "bg-red-500"
                          : item.priority === "HIGH"
                          ? "bg-amber-500"
                          : item.priority === "MEDIUM"
                          ? "bg-blue-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignee Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            Assignee Workload
          </h3>

          {data.assigneeBreakdown.length === 0 && data.unassignedCount === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No tasks in project</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {data.assigneeBreakdown.map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {getInitials(assignee.name, assignee.email)}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {assignee.name || assignee.email}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {assignee.taskCount} tasks
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {assignee.completedCount} done
                    </span>
                  </div>
                </div>
              ))}

              {data.unassignedCount > 0 && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <User className="h-4 w-4" />
                    <span>Unassigned</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {data.unassignedCount} tasks
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Tasks List if any */}
      {data.overdueTasks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Overdue Tasks Requiring Attention ({data.overdueTasks.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.overdueTasks.map((t) => (
              <div
                key={t.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {t.taskIdentifier}
                  </span>
                  <Link
                    href={`/projects/${data.project.id}/tasks/${t.id}`}
                    className="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {t.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-[11px]">
                    <Calendar className="h-3 w-3" />
                    <span>Due {formatDate(t.dueDate)}</span>
                  </div>
                  <TaskPriorityBadge priority={t.priority} />
                  <TaskStatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
