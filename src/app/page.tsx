"use client";
// app/page.tsx — Splash/loading screen
// Renders the VitalCare wordmark while auth state resolves,
// then the AuthContext route guard redirects to /dashboard or /login.
import { useAuth } from "@/contexts/AuthContext";

export default function SplashPage() {
  const { loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Wordmark */}
        <h1
          className="text-5xl font-bold tracking-tight"
          style={{ color: "#3730A3" }}
        >
          VitalCare
        </h1>
        <p className="text-sm text-slate-400 font-medium tracking-widest uppercase">
          Remote Health Monitoring
        </p>

        {/* Pulse indicator */}
        {loading && (
          <div className="mt-6 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
