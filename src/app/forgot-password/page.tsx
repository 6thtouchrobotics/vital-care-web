"use client";
import { useState } from "react";
import { apiPasswordResetRequest, ApiError } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiPasswordResetRequest(email);
    } catch {
      // intentionally swallow — don't leak whether account exists
    } finally {
      setSubmitting(false);
      // Always show confirmation regardless of outcome
      setSent(true);
    }
  }

  return (
    <AuthShell>
      <h2 className="text-2xl font-semibold text-slate-800 mb-1 text-center">
        Reset your password
      </h2>
      <p className="text-sm text-slate-500 text-center mb-8">
        Enter your email and we'll send you a reset link.
      </p>

      {sent ? (
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-emerald-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">Check your email</p>
          <p className="text-sm text-slate-500">
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </p>
          <Link href="/login" className="inline-block mt-2 text-sm text-indigo-600 hover:underline underline-offset-2">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-150"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            id="forgot-submit"
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {submitting ? "Sending…" : "Send Reset Link"}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className="text-indigo-600 hover:underline underline-offset-2">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
