import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Sign In - Project Tracker",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md h-96 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
