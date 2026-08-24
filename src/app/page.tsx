export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            Phase 1 Initialized
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Project Tracker</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Next.js App Router, TypeScript, Tailwind CSS, and Prisma with PostgreSQL foundation ready.
          </p>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Database Models</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3 text-center">
              <span className="text-xs font-medium text-slate-500">Model</span>
              <p className="text-sm font-semibold mt-1">User</p>
            </div>
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3 text-center">
              <span className="text-xs font-medium text-slate-500">Model</span>
              <p className="text-sm font-semibold mt-1">Project</p>
            </div>
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3 text-center">
              <span className="text-xs font-medium text-slate-500">Model</span>
              <p className="text-sm font-semibold mt-1">Task</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
