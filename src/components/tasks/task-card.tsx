import React from "react";
import Link from "next/link";
import { TaskItem } from "@/server/queries/task.queries";
import { TaskPriorityBadge } from "./task-priority-badge";
import { Calendar, Clock, AlertTriangle, User } from "lucide-react";

interface TaskCardProps {
  task: TaskItem;
  projectId: string;
  isDragging?: boolean;
  canEdit?: boolean;
}

export function TaskCard({
  task,
  projectId,
  isDragging = false,
}: TaskCardProps) {
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

  const isOverdue =
    task.dueDate &&
    task.status !== "DONE" &&
    new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm transition-all select-none ${
        isDragging
          ? "opacity-50 border-indigo-500 scale-[1.02] shadow-lg ring-2 ring-indigo-500/20"
          : "border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800"
      }`}
    >
      {/* Top Header: Identifier & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {task.taskIdentifier}
        </span>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
      <Link
        href={`/projects/${projectId}/tasks/${task.id}`}
        className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
      >
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
          {task.title}
        </h4>
      </Link>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
          {task.description}
        </p>
      )}

      {/* Footer: Due Date & Assignee */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        {task.dueDate ? (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${
              isOverdue
                ? "text-red-600 dark:text-red-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
            title={`Due date: ${new Date(task.dueDate).toLocaleDateString()}`}
          >
            {isOverdue ? (
              <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
            ) : (
              <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
            )}
            <span>{formatDate(task.dueDate)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="h-3 w-3 shrink-0" />
            <span>No due date</span>
          </div>
        )}

        {/* Assignee Avatar */}
        {task.assignee ? (
          <div
            className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0"
            title={`Assignee: ${task.assignee.name || task.assignee.email}`}
          >
            {getInitials(task.assignee.name, task.assignee.email)}
          </div>
        ) : (
          <div
            className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0"
            title="Unassigned"
          >
            <User className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
}
