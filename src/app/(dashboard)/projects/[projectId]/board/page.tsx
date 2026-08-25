import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getKanbanTasks } from "@/server/queries/task.queries";
import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { ChevronLeft, Kanban } from "lucide-react";
import { ProjectMemberRole } from "@prisma/client";

interface BoardPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateMetadata({ params }: BoardPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Kanban Board - Project Tracker" };

  const data = await getKanbanTasks(projectId, user.id);
  if (!data) return { title: "Board Not Found" };

  return {
    title: `Board - ${data.project.name} (${data.project.key}) - Project Tracker`,
  };
}

export default async function ProjectBoardPage({ params }: BoardPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const data = await getKanbanTasks(projectId, user.id);

  if (!data) {
    notFound();
  }

  const canEdit = data.userRole !== ProjectMemberRole.VIEWER;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
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
          Kanban Board
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Kanban className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {data.project.key}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Kanban Board
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Drag and drop tasks across workflow stages to organize project deliverables.
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="shrink-0">
              <CreateTaskModal
                projectId={data.project.id}
                members={data.members}
                buttonLabel="Create Task"
              />
            </div>
          )}
        </div>

        <ProjectNavTabs projectId={data.project.id} />
      </div>

      {/* Interactive Kanban Board */}
      <KanbanBoard
        projectId={data.project.id}
        initialColumns={data.columns}
        members={data.members}
        canEdit={canEdit}
      />
    </div>
  );
}
