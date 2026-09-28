"use client";
import { useState, useEffect } from "react";
import { apiGetVitals, VitalsLog } from "@/lib/api";
import NavBar from "@/components/NavBar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const STATUS_BADGE: Record<string, string> = {
  normal:   "bg-emerald-100 text-emerald-700",
  warning:  "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<VitalsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"table" | "chart">("table");

  useEffect(() => {
    apiGetVitals()
      .then(setLogs)
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  const chartData = [...logs]
    .reverse()
    .map((l) => ({
      time: new Date(l.timestamp || l.created_at).toLocaleDateString(),
      Temperature: l.temperature,
      "Heart Rate": l.heart_rate,
      "SpO₂": l.spo2,
    }));

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">History</h1>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button
              id="view-table"
              onClick={() => setView("table")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === "table"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Table
            </button>
            <button
              id="view-chart"
              onClick={() => setView("chart")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === "chart"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Chart
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-12 text-center">
            <p className="text-slate-500">No readings found yet.</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <>
            {view === "table" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Temp °C</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">HR bpm</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SpO₂ %</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp || log.created_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {log.temperature.toFixed(1)}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {log.heart_rate}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {log.spo2.toFixed(1)}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                STATUS_BADGE[log.status] ?? STATUS_BADGE.normal
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === "chart" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-6">
                <h2 className="text-sm font-semibold text-slate-600 mb-4">Vitals Trend</h2>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Temperature"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Heart Rate"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="SpO₂"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
