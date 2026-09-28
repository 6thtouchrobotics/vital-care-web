"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiLogin, apiRegister, apiGetMe, AuthResponse } from "@/lib/api";

const TOKEN_KEY = "vitalcare_token";

export interface AuthUser {
  user_id: number;
  username: string;
  email: string;
  patient_id: number;
  has_doctor: boolean;
  doctor: Record<string, unknown> | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setDoctor: (doctor: Record<string, unknown>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  function applySession(resp: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, resp.token);
    const u: AuthUser = {
      user_id: resp.user_id,
      username: resp.username,
      email: resp.email,
      patient_id: resp.patient_id,
      has_doctor: resp.has_doctor,
      doctor: resp.doctor,
    };
    setUser(u);
    return u;
  }

  // Bootstrap: check token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    apiGetMe()
      .then((me) => {
        setUser({
          user_id: 0,
          username: me.username ?? "",
          email: me.email ?? "",
          patient_id: me.id ?? 0,
          has_doctor: me.has_doctor,
          doctor: me.doctor,
        });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  // Route guard
  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_ROUTES.some((r) => pathname === r);
    if (!user) {
      if (pathname === "/") router.replace("/login");
      else if (!isPublic) router.replace("/login");
    } else {
      if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
        router.replace(user.has_doctor ? "/dashboard" : "/onboarding");
      } else if (!user.has_doctor && pathname === "/dashboard") {
        router.replace("/onboarding");
      }
    }
  }, [loading, user, pathname, router]);

  const login = useCallback(async (username: string, password: string) => {
    const resp = await apiLogin(username, password);
    const u = applySession(resp);
    router.push(u.has_doctor ? "/dashboard" : "/onboarding");
  }, [router]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const resp = await apiRegister(username, email, password);
    applySession(resp);
    // new accounts never have a doctor yet
    router.push("/onboarding");
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  const setDoctor = useCallback((doctor: Record<string, unknown>) => {
    setUser((prev) => prev ? { ...prev, has_doctor: true, doctor } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setDoctor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
