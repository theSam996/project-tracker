"use client";

import React, { useState, useTransition } from "react";
import { TaskStatus } from "@prisma/client";
import { TaskItem } from "@/server/queries/task.queries";
import { moveTask } from "@/server/actions/task.actions";
import { TaskCard } from "./task-card";
import { CreateTaskModal } from "./create-task-modal";
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface KanbanBoardProps {
  projectId: string;
  initialColumns: Record<TaskStatus, TaskItem[]>;
  members: { id: string; name: string | null; email: string }[];
  canEdit: boolean;
}

const COLUMNS_CONFIG = [
  {
    status: TaskStatus.TODO,
    title: "To Do",
    icon: ListTodo,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800/80",
    border: "border-slate-200 dark:border-slate-800",
    badgeBg: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
  },
  {
    status: TaskStatus.IN_PROGRESS,
    title: "In Progress",
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/40",
    badgeBg: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
  },
  {
    status: TaskStatus.IN_REVIEW,
    title: "In Review",
    icon: AlertCircle,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50/50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-900/40",
    badgeBg: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300",
  },
  {
    status: TaskStatus.DONE,
    title: "Done",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/40",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
  },
];

export function KanbanBoard({
  projectId,
  initialColumns,
  members,
  canEdit,
}: KanbanBoardProps) {
  const [prevInitialColumns, setPrevInitialColumns] = useState(initialColumns);
  const [columns, setColumns] = useState<Record<TaskStatus, TaskItem[]>>(initialColumns);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setColumns(initialColumns);
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!canEdit) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!canEdit) return;
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId || !canEdit) return;

    // Find source column and task
    let sourceStatus: TaskStatus | null = null;
    let draggedTask: TaskItem | null = null;

    for (const [status, tasks] of Object.entries(columns)) {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        sourceStatus = status as TaskStatus;
        draggedTask = found;
        break;
      }
    }

    if (!sourceStatus || !draggedTask) return;

    // If dropped in the same column at the end, no status change needed unless reordered
    if (sourceStatus === targetStatus) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic UI update
    const previousState = { ...columns };
    const nextColumns = { ...columns };

    // Remove from source
    nextColumns[sourceStatus] = nextColumns[sourceStatus].filter((t) => t.id !== taskId);

    // Calculate target order
    const targetTasks = nextColumns[targetStatus] || [];
    const newOrder = targetTasks.length > 0 ? Math.max(...targetTasks.map((t) => t.order)) + 1 : 1;

    // Add to target
    const updatedTask: TaskItem = {
      ...draggedTask,
      status: targetStatus,
      order: newOrder,
    };
    nextColumns[targetStatus] = [...targetTasks, updatedTask];

    setColumns(nextColumns);
    setDraggedTaskId(null);
    setErrorMessage(null);

    // Persist via Server Action
    startTransition(async () => {
      const result = await moveTask(projectId, {
        taskId,
        status: targetStatus,
        order: newOrder,
      });

      if (!result.success) {
        // Rollback optimistic state
        setColumns(previousState);
        setErrorMessage(result.error || "Failed to move task.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Error alert if optimistic update failed */}
      {errorMessage && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
        {COLUMNS_CONFIG.map((col) => {
          const tasks = columns[col.status] || [];
          const isDragOver = dragOverColumn === col.status;
          const Icon = col.icon;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-2xl border ${col.border} ${
                col.bg
              } p-4 transition-all min-h-[480px] flex flex-col justify-between ${
                isDragOver
                  ? "ring-2 ring-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20"
                  : ""
              }`}
            >
              <div className="space-y-3">
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${col.color}`} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {col.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.badgeBg}`}
                    >
                      {tasks.length}
                    </span>
                  </div>

                  {canEdit && (
                    <CreateTaskModal
                      projectId={projectId}
                      members={members}
                      initialStatus={col.status}
                      buttonLabel=""
                      className="!p-1.5 !rounded-lg !bg-transparent hover:!bg-slate-200/70 dark:hover:!bg-slate-800/70 !text-slate-600 dark:!text-slate-400 !shadow-none"
                    />
                  )}
                </div>

                {/* Task Cards in Column */}
                <div className="space-y-2.5 min-h-[100px]">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={canEdit}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={canEdit ? "cursor-grab active:cursor-grabbing" : ""}
                      >
                        <TaskCard
                          task={task}
                          projectId={projectId}
                          isDragging={draggedTaskId === task.id}
                          canEdit={canEdit}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-3 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                      <span>No tasks in {col.title.toLowerCase()}</span>
                      {canEdit && (
                        <span className="text-[11px] text-slate-400">
                          Drag here or click + to add
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Column Footer: Quick add button */}
              {canEdit && (
                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 mt-3">
                  <CreateTaskModal
                    projectId={projectId}
                    members={members}
                    initialStatus={col.status}
                    buttonLabel={`Add to ${col.title}`}
                    className="w-full justify-center !py-1.5 !text-xs !bg-white dark:!bg-slate-900 hover:!bg-slate-50 dark:hover:!bg-slate-800 !text-slate-700 dark:!text-slate-200 !border !border-slate-200 dark:!border-slate-800 !shadow-none"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isPending && (
        <div className="fixed bottom-6 right-6 z-40 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
          <span>Syncing Kanban changes...</span>
        </div>
      )}
    </div>
  );
}
