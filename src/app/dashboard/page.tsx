"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiGetVitals,
  apiGetAiInsight,
  apiDownloadReport,
  apiSendReport,
  ApiError,
  VitalsLog,
} from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  normal:   { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  warning:  { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  critical: { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500"     },
};

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<VitalsLog | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCriticalBanner, setShowCriticalBanner] = useState(true);

  function addToast(type: "success" | "error", message: string) {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }

  const fetchVitals = useCallback(async (silent = false) => {
    if (!silent) setLoadingVitals(true);
    else setRefreshing(true);
    try {
      const logs = await apiGetVitals();
      setVitals(logs[0] ?? null);
      setShowCriticalBanner(true); // reset banner on new fetch
      if (!silent) setAiInsight(null);
    } catch {
      addToast("error", "Failed to load vitals.");
    } finally {
      setLoadingVitals(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  async function handleGetAiInsight() {
    if (!vitals) return;
    setLoadingAi(true);
    setAiInsight(null);
    try {
      const res = await apiGetAiInsight(vitals.id);
      setAiInsight(res.insight ?? "No insight available for this reading.");
    } catch {
      setAiInsight("Unable to generate AI insight at this time.");
    } finally {
      setLoadingAi(false);
    }
  }

  async function handleDownloadPdf() {
    if (!vitals) return;
    setDownloadingPdf(true);
    try {
      const blob = await apiDownloadReport(vitals.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vitalcare-report-${vitals.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      addToast("error", "Failed to download report.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleSendReport() {
    if (!vitals) return;
    setSendingReport(true);
    try {
      const res = await apiSendReport(vitals.id);
      addToast("success", res.detail ?? "Report sent to your doctor.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        addToast("error", "No doctor assigned — please complete onboarding.");
      } else {
        addToast("error", "Failed to send report.");
      }
    } finally {
      setSendingReport(false);
    }
  }

  const statusStyle = vitals ? STATUS_COLORS[vitals.status] ?? STATUS_COLORS.normal : STATUS_COLORS.normal;
  const doctorName = user?.doctor && typeof (user.doctor as any).name === "string"
    ? `Dr. ${(user.doctor as any).name}`
    : "Your Doctor";

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Doctor & User header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Assigned Doctor</p>
            <p className="text-lg font-semibold text-slate-800 mt-0.5">{doctorName}</p>
          </div>
          <button
            id="dashboard-refresh"
            onClick={() => fetchVitals(true)}
            disabled={refreshing}
            title="Get new reading"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 disabled:opacity-50 text-slate-600 hover:text-slate-800"
            style={{ backgroundColor: "#f5f5f5" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 shrink-0 ${refreshing ? "animate-spin" : ""}`}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            {refreshing ? "Refreshing…" : "New Reading"}
          </button>
        </div>

        {/* Loading skeleton */}
        {loadingVitals && (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 h-32 animate-pulse" />
            ))}
          </div>
        )}

        {/* No readings */}
        {!loadingVitals && !vitals && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-12 text-center">
            <p className="text-slate-500">No vitals readings yet.</p>
            <p className="text-sm text-slate-400 mt-1">Readings appear once your device syncs.</p>
          </div>
        )}

        {/* Vitals */}
        {!loadingVitals && vitals && (
          <>
            {/* Critical banner */}
            {vitals.status === "critical" && showCriticalBanner && (
              <div className="rounded-2xl border border-red-200 px-6 py-4 flex items-center gap-3" style={{ backgroundColor: "#fff5f5" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0 text-red-500">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-700 flex-1">
                  Report automatically sent to {doctorName}
                </span>
                <button
                  onClick={() => setShowCriticalBanner(false)}
                  className="ml-2 p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors duration-150"
                  title="Dismiss"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* Stat blocks */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Temperature"
                value={`${vitals.temperature.toFixed(1)}°C`}
                icon="🌡️"
              />
              <StatCard
                label="Heart Rate"
                value={`${vitals.heart_rate} bpm`}
                icon="❤️"
              />
              <StatCard
                label="SpO₂"
                value={`${vitals.spo2.toFixed(1)}%`}
                icon="💧"
              />
              <StatCard
                label="Rhythm"
                value={vitals.rhythm_status}
                capitalize
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-indigo-500">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                }
              />
            </div>

            {/* Status badge */}
            <div
              className={`${statusStyle.bg} rounded-2xl border border-slate-100 px-6 py-4 flex items-center gap-3`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.dot}`} />
              <span className={`text-sm font-semibold ${statusStyle.text}`}>
                Status: {vitals.status.charAt(0).toUpperCase() + vitals.status.slice(1)}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {new Date(vitals.timestamp || vitals.created_at).toLocaleString()}
              </span>
            </div>

            {/* AI Overview */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 space-y-4">
              <h3 className="font-semibold text-slate-800">AI Overview</h3>
              {aiInsight && (
                <p className="text-sm text-slate-600 leading-relaxed bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  {aiInsight}
                </p>
              )}
              {!aiInsight && (
                <button
                  id="get-ai-insight"
                  onClick={handleGetAiInsight}
                  disabled={loadingAi}
                  className="w-full py-2.5 rounded-xl font-medium text-slate-600 hover:text-slate-800 border border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 text-sm"
                  style={{ backgroundColor: "#f5f5f5" }}
                >
                  {loadingAi ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Generating insight…
                    </span>
                  ) : "✦ Get AI Insight"}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 space-y-3">
              <h3 className="font-semibold text-slate-800 mb-1">Reports</h3>

              <button
                id="download-report"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="w-full py-2.5 rounded-xl font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 text-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {downloadingPdf ? "Downloading…" : "Download Report"}
              </button>

              {/* Send button — only if not critical (critical auto-sends) */}
              {vitals.status !== "critical" && (
                <button
                  id="send-report"
                  onClick={handleSendReport}
                  disabled={sendingReport}
                  className="w-full py-2.5 rounded-xl font-medium text-white bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 text-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {sendingReport ? "Sending…" : "Send Report to Doctor"}
                </button>
              )}
            </div>
          </>
        )}
      </main>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  capitalize = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5">
      <div className="text-2xl mb-0.5 flex items-center h-8">{icon}</div>
      <p
        className={`text-2xl font-bold text-slate-800 mt-2 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
