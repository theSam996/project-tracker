"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchGlobalAction } from "@/server/actions/search.actions";
import { GlobalSearchResults } from "@/server/queries/search.queries";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import {
  Search,
  X,
  FolderKanban,
  CheckSquare,
  Loader2,
  ArrowRight,
  Command,
} from "lucide-react";

export function GlobalSearchDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>({ projects: [], tasks: [] });
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResults({ projects: [], tasks: [] });
  };

  // Keyboard shortcut listener: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleQueryChange = (val: string) => {
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setResults({ projects: [], tasks: [] });
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await searchGlobalAction(val);
        if (res.success && res.data) {
          setResults(res.data);
        }
      });
    }, 200);
  };

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const totalResults = results.projects.length + results.tasks.length;
  const hasSearched = query.trim().length > 0;

  return (
    <>
      {/* Topbar Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs transition-all border border-slate-200/80 dark:border-slate-700/80 w-36 sm:w-60 justify-between cursor-pointer"
        aria-label="Search projects and tasks"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Search workspace...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Global search dialog"
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Type project name, key, or task title..."
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {isPending && <Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0" />}
              {query && (
                <button
                  onClick={() => handleQueryChange("")}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Results Container */}
            <div className="overflow-y-auto p-4 space-y-5 divide-y divide-slate-100 dark:divide-slate-800/80">
              {!hasSearched ? (
                <div className="py-10 text-center space-y-2 text-xs text-slate-400 dark:text-slate-500">
                  <p className="font-medium text-slate-600 dark:text-slate-400">
                    Search across all your projects and tasks
                  </p>
                  <p>Try searching for a project key, task title, or keyword</p>
                </div>
              ) : totalResults === 0 && !isPending ? (
                <div className="py-10 text-center space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No results found
                  </p>
                  <p>No projects or tasks matched &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                <>
                  {/* Projects Group */}
                  {results.projects.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span>Projects ({results.projects.length})</span>
                      </div>
                      <div className="space-y-1">
                        {results.projects.map((project) => (
                          <div
                            key={project.id}
                            onClick={() => handleNavigate(`/projects/${project.id}`)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {project.key}
                              </span>
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                {project.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ProjectStatusBadge status={project.status} />
                              <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks Group */}
                  {results.tasks.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Tasks ({results.tasks.length})</span>
                      </div>
                      <div className="space-y-1">
                        {results.tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() =>
                              handleNavigate(`/projects/${task.projectId}/tasks/${task.id}`)
                            }
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {task.taskIdentifier}
                              </span>
                              <div className="truncate">
                                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                  {task.title}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  in {task.projectName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <TaskPriorityBadge priority={task.priority} />
                              <TaskStatusBadge status={task.status} />
                              <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Press ESC or click outside to dismiss</span>
              <span>PostgreSQL Search</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
