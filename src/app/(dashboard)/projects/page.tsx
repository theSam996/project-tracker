import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getProjects } from "@/server/queries/project.queries";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilterBar } from "@/components/projects/project-filter-bar";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { FolderKanban, FolderPlus } from "lucide-react";

export const metadata = {
  title: "Projects - Project Tracker",
};

interface ProjectsPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    sort?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { status, q, sort } = await searchParams;

  const projects = await getProjects({
    userId: user.id,
    status,
    q,
    sort,
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FolderKanban className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            <span>Projects</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your active workspaces, initiatives, and team deliverables.
          </p>
        </div>

        <div className="shrink-0">
          <CreateProjectModal />
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
        <ProjectFilterBar />
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
            <FolderPlus className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {q || status ? "No matching projects found" : "No projects yet"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {q || status
                ? "Try adjusting your search criteria or status filter to see other projects."
                : "Get started by creating your first project workspace to organize tasks and collaborate with team members."}
            </p>
          </div>
          {!q && !status && (
            <div className="pt-2">
              <CreateProjectModal />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
