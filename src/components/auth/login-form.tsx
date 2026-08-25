"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/server/actions/auth.actions";
import { LoginSchema } from "@/lib/validations/auth";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const validation = LoginSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0]?.toString();
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUser(validation.data);
      if (!result.success) {
        setGeneralError(result.error || "Invalid credentials.");
      } else {
        router.push(redirectPath);
        router.refresh();
      }
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome back
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter your credentials to access your workspace
        </p>
      </div>

      {isRegistered && !generalError && (
        <div
          role="status"
          className="flex items-center gap-2 p-3 text-sm text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Account created successfully! Please sign in with your credentials.</span>
        </div>
      )}

      {generalError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="jane@example.com"
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.email
                ? "border-red-500 focus:ring-red-400 dark:border-red-500"
                : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.password
                ? "border-red-500 focus:ring-red-400 dark:border-red-500"
                : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
