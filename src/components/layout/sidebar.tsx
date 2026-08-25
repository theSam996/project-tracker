"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { logoutUser } from "@/server/actions/auth.actions";

interface SidebarProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, startTransition] = useTransition();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
      isReady: true,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: FolderKanban,
      active: pathname.startsWith("/projects"),
      isReady: false,
      badge: "Phase 3",
    },
    {
      name: "My Tasks",
      href: "/tasks",
      icon: CheckSquare,
      active: pathname.startsWith("/tasks"),
      isReady: false,
      badge: "Phase 4",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
      isReady: false,
      badge: "Phase 5",
    },
  ];

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser();
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
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 shrink-0 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold">
          <CheckSquare className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
            Project Tracker
          </span>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-indigo-600 dark:text-indigo-400">
            Workspace
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
        <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${item.active ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            {getInitials(user.name, user.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
