import React from "react";
import { ProjectStatus } from "@prisma/client";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({ status, className = "" }: ProjectStatusBadgeProps) {
  const getStatusStyles = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case ProjectStatus.ACTIVE:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case ProjectStatus.ON_HOLD:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case ProjectStatus.COMPLETED:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      case ProjectStatus.ARCHIVED:
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const formatStatus = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING:
        return "Planning";
      case ProjectStatus.ACTIVE:
        return "Active";
      case ProjectStatus.ON_HOLD:
        return "On Hold";
      case ProjectStatus.COMPLETED:
        return "Completed";
      case ProjectStatus.ARCHIVED:
        return "Archived";
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
