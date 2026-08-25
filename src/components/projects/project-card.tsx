import React from "react";
import Link from "next/link";
import { ProjectListItem } from "@/server/queries/project.queries";
import { ProjectStatusBadge } from "./project-status-badge";
import {
  Calendar,
  CheckCircle2,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";

interface ProjectCardProps {
  project: ProjectListItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between">
      <div>
        {/* Top bar: Key, Status, Role */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold tracking-wide border border-indigo-200 dark:border-indigo-800">
              {project.key}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {project.isOwner ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <Shield className="h-3 w-3" /> Owner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {project.userRole}
              </span>
            )}
          </div>
        </div>

        {/* Project Title & Description */}
        <Link href={`/projects/${project.id}`} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
            {project.name}
          </h3>
        </Link>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 min-h-[2.5rem]">
          {project.description || "No description provided."}
        </p>

        {/* Timeline Metadata */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">Start: {formatDate(project.startDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">Due: {formatDate(project.targetDate)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Progress & Footer Info */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              {project.taskCount === 0 ? "No tasks yet" : `${project.completedTaskCount} of ${project.taskCount} tasks`}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {project.progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                project.progressPercentage === 100
                  ? "bg-emerald-500"
                  : "bg-indigo-600 dark:bg-indigo-500"
              }`}
              style={{ width: `${Math.min(Math.max(project.progressPercentage, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Card Footer: Owner & Link */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center"
              title={`Owner: ${project.owner.name || project.owner.email}`}
            >
              {getInitials(project.owner.name, project.owner.email)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px] sm:max-w-[130px]">
              {project.owner.name || project.owner.email}
            </span>
            {project.memberCount > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                <Users className="h-3 w-3" />
                {project.memberCount}
              </span>
            )}
          </div>

          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <span>View</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
