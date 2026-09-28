// components/AuthShell.tsx
// Centered card shell used by all auth pages (login, signup, etc.)
import React from "react";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ color: "#3730A3" }}
          >
            VitalCare
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
