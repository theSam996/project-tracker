import React from "react";
import { TaskStatus } from "@prisma/client";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className = "" }: TaskStatusBadgeProps) {
  const getStatusStyles = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
      case TaskStatus.IN_REVIEW:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
      case TaskStatus.DONE:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const formatStatus = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "To Do";
      case TaskStatus.IN_PROGRESS:
        return "In Progress";
      case TaskStatus.IN_REVIEW:
        return "In Review";
      case TaskStatus.DONE:
        return "Done";
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyles(
        status
      )} ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}
