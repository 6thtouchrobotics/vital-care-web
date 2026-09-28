"use client";
// components/NavBar.tsx
// Top navigation bar for authenticated pages.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const initial = user?.username?.[0]?.toUpperCase() ?? "";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/history", label: "History" },
  ];

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight"
          style={{ color: "#3730A3" }}
        >
          VitalCare
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? "text-slate-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
              style={pathname === href ? { backgroundColor: "#f5f5f5" } : {}}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* User avatar + logout */}
        <div className="flex items-center gap-3">
          {/* Avatar initial */}
          <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center text-sm font-semibold select-none">
            {initial ? initial : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>

          {/* Logout button */}
          <button
            id="nav-logout"
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden border-t border-slate-100 flex">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors ${
              pathname === href
                ? "text-indigo-700 border-b-2 border-indigo-700"
                : "text-slate-500"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}
