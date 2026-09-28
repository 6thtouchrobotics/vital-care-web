"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetDoctors, apiOnboard, ApiError, Doctor } from "@/lib/api";

export default function OnboardingPage() {
  const { user, loading, setDoctor } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return; // guard handled by AuthContext

    apiGetDoctors()
      .then((d) => setDoctors(d))
      .catch(() => setError("Failed to load doctors. Please refresh."))
      .finally(() => setLoadingDoctors(false));
  }, [user, loading]);

  async function handleProceed(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) {
      setError("Please select a doctor to continue.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiOnboard(Number(selectedId));
      const doc = doctors.find((d) => d.id === Number(selectedId));
      if (doc) setDoctor(doc as unknown as Record<string, unknown>);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#3730A3" }}
          >
            VitalCare
          </span>
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-slate-800">Choose a Doctor</h1>
            <p className="mt-2 text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              Take care of your body. It's the only place you have to live.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {loadingDoctors ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleProceed} className="space-y-5">
              <div>
                <label
                  htmlFor="doctor-select"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Select your doctor
                </label>
                <select
                  id="doctor-select"
                  value={selectedId}
                  onChange={(e) =>
                    setSelectedId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-150 appearance-none cursor-pointer"
                >
                  <option value="">— Choose a doctor —</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.specialty ? ` · ${d.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor preview card */}
              {selectedId && (() => {
                const doc = doctors.find((d) => d.id === selectedId);
                return doc ? (
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                    <p className="font-semibold text-indigo-900">{doc.name}</p>
                    {doc.specialty && (
                      <p className="text-sm text-indigo-600 mt-0.5">{doc.specialty}</p>
                    )}
                  </div>
                ) : null;
              })()}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                id="onboard-proceed"
                type="submit"
                disabled={submitting || !selectedId}
                className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {submitting ? "Saving…" : "Proceed"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
