"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  ListTodo,
  BarChart3,
  Settings,
} from "lucide-react";

interface ProjectNavTabsProps {
  projectId: string;
}

export function ProjectNavTabs({ projectId }: ProjectNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Overview",
      href: `/projects/${projectId}`,
      icon: LayoutDashboard,
      active: pathname === `/projects/${projectId}`,
      isReady: true,
    },
    {
      name: "Board",
      href: `/projects/${projectId}/board`,
      icon: Kanban,
      active: pathname.startsWith(`/projects/${projectId}/board`),
      isReady: true,
    },
    {
      name: "List",
      href: `/projects/${projectId}/list`,
      icon: ListTodo,
      active: pathname.startsWith(`/projects/${projectId}/list`),
      isReady: true,
    },
    {
      name: "Analytics",
      href: `/projects/${projectId}/analytics`,
      icon: BarChart3,
      active: pathname.startsWith(`/projects/${projectId}/analytics`),
      isReady: false,
      badge: "Phase 5",
    },
    {
      name: "Settings",
      href: `/projects/${projectId}/settings`,
      icon: Settings,
      active: pathname.startsWith(`/projects/${projectId}/settings`),
      isReady: true,
    },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          if (!tab.isReady) {
            return (
              <div
                key={tab.name}
                className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60 rounded-xl"
                title={`${tab.name} will be available in ${tab.badge}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                    {tab.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                tab.active
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  tab.active ? "text-indigo-600 dark:text-indigo-400" : ""
                }`}
              />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
