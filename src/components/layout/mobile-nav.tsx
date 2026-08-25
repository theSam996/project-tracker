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
  X,
  Loader2,
} from "lucide-react";
import { logoutUser } from "@/server/actions/auth.actions";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function MobileNav({ isOpen, onClose, user }: MobileNavProps) {
  const pathname = usePathname();
  const [isLoggingOut, startTransition] = useTransition();

  if (!isOpen) return null;

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
      isReady: true,
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
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl z-10 border-r border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
              Project Tracker
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Mobile Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  item.active
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
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
      </div>
    </div>
  );
}
