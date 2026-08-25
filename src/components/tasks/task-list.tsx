"use client";

import React from "react";
import Link from "next/link";
import { TaskItem } from "@/server/queries/task.queries";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { EditTaskModal } from "./edit-task-modal";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { Calendar, User, Edit3, Trash2 } from "lucide-react";

interface TaskListProps {
  projectId: string;
  tasks: TaskItem[];
  members: { id: string; name: string | null; email: string }[];
  canEdit: boolean;
  isOwner: boolean;
  currentUserId: string;
}

export function TaskList({
  projectId,
  tasks,
  members,
  canEdit,
  isOwner,
  currentUserId,
}: TaskListProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
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

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        No tasks found matching your criteria.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Task</th>
              <th className="py-3.5 px-4">Title</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Assignee</th>
              <th className="py-3.5 px-4">Due Date</th>
              {canEdit && <th className="py-3.5 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {tasks.map((task) => {
              const canDelete = isOwner || task.creator?.id === currentUserId;

              return (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Task Key */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {task.taskIdentifier}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                    <Link
                      href={`/projects/${projectId}/tasks/${task.id}`}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {task.title}
                    </Link>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <TaskStatusBadge status={task.status} />
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <TaskPriorityBadge priority={task.priority} />
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                          {getInitials(task.assignee.name, task.assignee.email)}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {task.assignee.name || task.assignee.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <User className="h-3 w-3" /> Unassigned
                      </span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  {canEdit && (
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <EditTaskModal
                          projectId={projectId}
                          task={task}
                          members={members}
                          trigger={
                            <button
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit Task"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          }
                        />

                        {canDelete && (
                          <DeleteTaskDialog
                            projectId={projectId}
                            taskId={task.id}
                            taskIdentifier={task.taskIdentifier}
                            taskTitle={task.title}
                            trigger={
                              <button
                                className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            }
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
