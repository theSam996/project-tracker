import React from "react";
import { TaskPriority } from "@prisma/client";
import { ArrowDown, ArrowRight, ArrowUp, AlertCircle } from "lucide-react";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  showIcon?: boolean;
}

export function TaskPriorityBadge({
  priority,
  className = "",
  showIcon = true,
}: TaskPriorityBadgeProps) {
  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return {
          label: "Low",
          style: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
          icon: ArrowDown,
          iconColor: "text-slate-400",
        };
      case TaskPriority.MEDIUM:
        return {
          label: "Medium",
          style: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
          icon: ArrowRight,
          iconColor: "text-blue-500",
        };
      case TaskPriority.HIGH:
        return {
          label: "High",
          style: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          icon: ArrowUp,
          iconColor: "text-amber-500",
        };
      case TaskPriority.URGENT:
        return {
          label: "Urgent",
          style: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
          icon: AlertCircle,
          iconColor: "text-red-500",
        };
      default:
        return {
          label: priority,
          style: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          icon: ArrowRight,
          iconColor: "text-slate-400",
        };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.style} ${className}`}
    >
      {showIcon && <Icon className={`h-3 w-3 ${config.iconColor}`} />}
      <span>{config.label}</span>
    </span>
  );
}
