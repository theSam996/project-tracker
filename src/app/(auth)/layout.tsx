import React from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 transition-colors">
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-lg">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <CheckSquare className="h-5 w-5" />
          </div>
          <span>Project Tracker</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex items-center justify-center my-8">
        {children}
      </main>

      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">
        &copy; {new Date().getFullYear()} Project Tracker. Production Grade Architecture.
      </footer>
    </div>
  );
}
