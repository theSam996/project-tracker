"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { GlobalSearchDialog } from "@/components/layout/global-search-dialog";

interface TopbarProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function Topbar({ user }: TopbarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Open mobile navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Workspace Overview
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              Project Tracker &bull; Enterprise Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <GlobalSearchDialog />

          <ThemeToggle />

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {getInitials(user.name, user.email)}
            </div>
            <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-300">
              {user.name || user.email}
            </span>
          </div>
        </div>
      </header>

      <MobileNav
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        user={user}
      />
    </>
  );
}
