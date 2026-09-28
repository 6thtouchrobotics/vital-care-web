"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiPasswordResetConfirm, ApiError } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid || !token) {
      setError("This reset link is invalid or has expired.");
    }
  }, [uid, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !token) return;
    setSubmitting(true);
    setError("");
    try {
      await apiPasswordResetConfirm(uid, token, newPassword);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please request a new reset link.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h2 className="text-2xl font-semibold text-slate-800 mb-1 text-center">
        Set new password
      </h2>
      <p className="text-sm text-slate-500 text-center mb-8">
        Choose a strong password for your account.
      </p>

      {done ? (
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-emerald-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">Password updated!</p>
          <p className="text-sm text-slate-500">Redirecting to login…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-150"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            id="reset-submit"
            type="submit"
            disabled={submitting || !uid || !token}
            className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {submitting ? "Updating…" : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
