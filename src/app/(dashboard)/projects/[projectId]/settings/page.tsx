import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/server/queries/project.queries";
import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";
import { MemberList } from "@/components/projects/member-list";
import { AddMemberDialog } from "@/components/projects/add-member-dialog";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { ArchiveProjectButton } from "@/components/projects/archive-project-button";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import {
  ChevronLeft,
  Users,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { ProjectStatus } from "@prisma/client";

interface ProjectSettingsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateMetadata({ params }: ProjectSettingsPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Settings - Project Tracker" };

  const project = await getProjectById(projectId, user.id);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `Settings - ${project.name} - Project Tracker`,
  };
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const project = await getProjectById(projectId, user.id);

  if (!project) {
    notFound();
  }

  const isArchived = project.status === ProjectStatus.ARCHIVED;

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
          href={`/projects/${project.id}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[150px]"
        >
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-semibold">
          Settings & Members
        </span>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-mono font-bold">
              {project.key}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Project Settings & Collaboration
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage team memberships, project attributes, and lifecycle state.
              </p>
            </div>
          </div>
        </div>

        <ProjectNavTabs projectId={project.id} />
      </div>

      {/* Main Settings Content */}
      <div className="space-y-6">
        {/* Member Management Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Project Members ({project.members.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Team members with access to this project workspace.
                </p>
              </div>
            </div>

            {project.isOwner && <AddMemberDialog projectId={project.id} />}
          </div>

          <MemberList
            projectId={project.id}
            isOwner={project.isOwner}
            currentUserId={user.id}
            members={project.members}
          />
        </div>

        {/* Project Properties Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Project Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Core configuration and scheduling timeline.
                </p>
              </div>
            </div>

            {project.isOwner && <EditProjectModal project={project} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Name</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{project.name}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Project Key</span>
              <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{project.key}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 md:col-span-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Description</span>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone (Owner Only) */}
        {project.isOwner && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-red-100 dark:border-red-900/40">
              <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-600 dark:text-red-400">
                  Danger Zone
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Irreversible and destructive actions for project owners.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Archive */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Archive Project
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hide this project from the active workspace without losing any project data.
                  </p>
                </div>
                <ArchiveProjectButton projectId={project.id} isArchived={isArchived} />
              </div>

              {/* Delete */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Delete Project Permanently
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Permanently delete this project workspace, all member associations, and tasks.
                  </p>
                </div>
                <DeleteProjectDialog
                  projectId={project.id}
                  projectName={project.name}
                  projectKey={project.key}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
