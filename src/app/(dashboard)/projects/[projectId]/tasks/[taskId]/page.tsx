import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getTaskById } from "@/server/queries/task.queries";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import {
  Calendar,
  Clock,
  Kanban,
  ListTodo,
} from "lucide-react";

interface TaskDetailPageProps {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
}

export async function generateMetadata({ params }: TaskDetailPageProps) {
  const { projectId, taskId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Task - Project Tracker" };

  const data = await getTaskById(projectId, taskId, user.id);
  if (!data) return { title: "Task Not Found" };

  return {
    title: `${data.task.taskIdentifier}: ${data.task.title} - Project Tracker`,
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { projectId, taskId } = await params;
  const data = await getTaskById(projectId, taskId, user.id);

  if (!data) {
    notFound();
  }

  const { task, project, members, canEdit, canDelete } = data;

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link
          href="/projects"
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Projects
        </Link>
        <span>/</span>
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[140px]"
        >
          {project.name}
        </Link>
        <span>/</span>
        <Link
          href={`/projects/${project.id}/board`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Board
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-semibold">
          {task.taskIdentifier}
        </span>
      </div>

      {/* Task Header & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-sm border border-indigo-200 dark:border-indigo-800">
              {task.taskIdentifier}
            </span>
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {canEdit && (
              <EditTaskModal
                projectId={project.id}
                task={task}
                members={members}
              />
            )}
            {canDelete && (
              <DeleteTaskDialog
                projectId={project.id}
                taskId={task.id}
                taskIdentifier={task.taskIdentifier}
                taskTitle={task.title}
                redirectOnDelete={`/projects/${project.id}/board`}
              />
            )}
          </div>
        </div>

        {/* Task Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {task.title}
        </h1>
      </div>

      {/* Main Grid: Description on Left, Attributes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Description
            </h3>
            {task.description ? (
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                No description provided for this task.
              </p>
            )}
          </div>

          {/* Quick Navigation Links */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between gap-4 text-xs">
            <Link
              href={`/projects/${project.id}/board`}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
            >
              <Kanban className="h-4 w-4" />
              <span>Back to Kanban Board</span>
            </Link>
            <Link
              href={`/projects/${project.id}/list`}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
            >
              <ListTodo className="h-4 w-4" />
              <span>View in Task List</span>
            </Link>
          </div>
        </div>

        {/* Right: Attributes Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              Task Details
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Assignee */}
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">
                  Assignee
                </span>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                      {getInitials(task.assignee.name, task.assignee.email)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {task.assignee.name || "User"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {task.assignee.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Unassigned</span>
                )}
              </div>

              {/* Creator */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">
                  Created By
                </span>
                {task.creator ? (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                      {getInitials(task.creator.name, task.creator.email)}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {task.creator.name || task.creator.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400">System</span>
                )}
              </div>

              {/* Due Date */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> Due Date
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(task.dueDate)}
                </span>
              </div>

              {/* Created At */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Created
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {formatDateTime(task.createdAt)}
                </span>
              </div>

              {/* Updated At */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Updated
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {formatDateTime(task.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
