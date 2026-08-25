import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/server/queries/project.queries";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { ArchiveProjectButton } from "@/components/projects/archive-project-button";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import {
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  ListTodo,
  ChevronLeft,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { ProjectStatus } from "@prisma/client";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Project - Project Tracker" };

  const project = await getProjectById(projectId, user.id);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.name} (${project.key}) - Project Tracker`,
  };
}

export default async function ProjectOverviewPage({ params }: ProjectPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const project = await getProjectById(projectId, user.id);

  if (!project) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isArchived = project.status === ProjectStatus.ARCHIVED;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-semibold truncate">
          {project.name}
        </span>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                {project.key}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {project.name}
              </h1>
              <ProjectStatusBadge status={project.status} />
              {project.isOwner ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <Shield className="h-3 w-3" /> Owner
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {project.userRole}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              {project.description || "No description provided for this project."}
            </p>
          </div>

          {/* Quick Actions (Owner only) */}
          {project.isOwner && (
            <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
              <EditProjectModal project={project} />
              <ArchiveProjectButton projectId={project.id} isArchived={isArchived} />
              <DeleteProjectDialog
                projectId={project.id}
                projectName={project.name}
                projectKey={project.key}
              />
            </div>
          )}
        </div>

        {/* Project Sub-navigation Tabs */}
        <ProjectNavTabs projectId={project.id} />
      </div>

      {/* Overview Metrics & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress & Milestones (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Project Completion Progress
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calculated in real-time from database task states.
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {project.progressPercentage}%
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  project.progressPercentage === 100
                    ? "bg-emerald-500"
                    : "bg-indigo-600 dark:bg-indigo-500"
                }`}
                style={{ width: `${Math.min(Math.max(project.progressPercentage, 0), 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Tasks</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                  {project.taskCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Completed</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {project.completedTaskCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Pending</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                  {project.taskCount - project.completedTaskCount}
                </span>
              </div>
            </div>
          </div>

          {/* Phase 4 Task Management Placeholder Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ListTodo className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Task Management & Kanban Board
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Interactive tasks, drag-and-drop boards, and sprint backlog will activate in Phase 4.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>
                Project structure, authorization, and member access are configured and ready for task integration.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Project Metadata & Team (1 col) */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Project Information
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Project Owner
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                  {project.owner.name || project.owner.email}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Start Date
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(project.startDate)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Target Date
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(project.targetDate)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Created On
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(project.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Team Members Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Project Team ({project.members.length})
                </h3>
              </div>

              <Link
                href={`/projects/${project.id}/settings`}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-2.5">
              {project.members.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {(member.user.name || member.user.email).slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
                      {member.user.name || member.user.email}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {member.role}
                  </span>
                </div>
              ))}
              {project.members.length > 5 && (
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  +{project.members.length - 5} more members
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
