"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/server/actions/auth.actions";
import { RegisterSchema } from "@/lib/validations/auth";
import { Loader2, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors for this field as the user types
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

    // Client-side validation using Zod
    const validation = RegisterSchema.safeParse(formData);
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
      const result = await registerUser(validation.data);
      if (!result.success) {
        setGeneralError(result.error || "Registration failed. Please try again.");
      } else {
        router.push("/login?registered=true");
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
          Create an account
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Get started with your production project tracker
        </p>
      </div>

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
            htmlFor="name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.name
                ? "border-red-500 focus:ring-red-400 dark:border-red-500"
                : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
          )}
        </div>

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
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.password
                ? "border-red-500 focus:ring-red-400 dark:border-red-500"
                : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
          {fieldErrors.password ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.confirmPassword
                ? "border-red-500 focus:ring-red-400 dark:border-red-500"
                : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.confirmPassword}
            </p>
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
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
