// lib/api.ts
// Central API client for VitalCare.
// Reads backend base URL from NEXT_PUBLIC_API_BASE_URL (never hardcoded).
// Attaches Authorization: Token <token> from localStorage automatically.
// Parses DRF error response shapes.

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;
  nonFieldErrors: string[];

  constructor(
    status: number,
    fieldErrors: Record<string, string[]>,
    nonFieldErrors: string[]
  ) {
    const msg =
      nonFieldErrors[0] ??
      Object.values(fieldErrors)[0]?.[0] ??
      "An unexpected error occurred.";
    super(msg);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.nonFieldErrors = nonFieldErrors;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vitalcare_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData && options.body
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/pdf") || ct.includes("application/octet-stream")) {
      return res.blob() as unknown as T;
    }
    // Some 200 responses with no body
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  // Parse DRF error shape
  let fieldErrors: Record<string, string[]> = {};
  let nonFieldErrors: string[] = [];
  try {
    const body = await res.json();
    if (typeof body === "object" && body !== null) {
      if (Array.isArray(body.non_field_errors)) nonFieldErrors = body.non_field_errors;
      if (typeof body.detail === "string") nonFieldErrors = [body.detail];
      for (const [k, v] of Object.entries(body)) {
        if (k === "non_field_errors" || k === "detail") continue;
        if (Array.isArray(v)) fieldErrors[k] = v as string[];
      }
    }
  } catch {
    nonFieldErrors = [res.statusText || "Request failed"];
  }

  throw new ApiError(res.status, fieldErrors, nonFieldErrors);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user_id: number;
  username: string;
  email: string;
  patient_id: number;
  has_doctor: boolean;
  doctor: Record<string, unknown> | null;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string | null;
}

export interface PatientMe {
  id: number;
  username: string;
  email: string;
  has_doctor: boolean;
  doctor: Record<string, unknown> | null;
}

export type VitalsStatus = "normal" | "warning" | "critical";

export interface VitalsLog {
  id: number;
  patient: number;
  patient_username: string;
  device: number;
  device_name: string;
  temperature: number;
  heart_rate: number;
  spo2: number;
  rhythm_status: string;
  status: VitalsStatus;
  ai_insight: string | null;
  timestamp: string;
  created_at: string;
}

export interface AiInsightResponse {
  insight: string | null;
  status: "success" | "unavailable";
}

export interface SendReportResponse {
  detail: string;
  doctor_email: string;
  vitals_log_id: number;
}

// ─── Auth endpoints ──────────────────────────────────────────────────────────

export const apiLogin = (username: string, password: string) =>
  request<AuthResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const apiRegister = (username: string, email: string, password: string) =>
  request<AuthResponse>("/api/v1/auth/register/", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });

export const apiPasswordResetRequest = (email: string) =>
  request<void>("/api/v1/auth/password-reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const apiPasswordResetConfirm = (uid: string, token: string, new_password: string) =>
  request<void>("/api/v1/auth/password-reset/confirm/", {
    method: "POST",
    body: JSON.stringify({ uid, token, new_password }),
  });

// ─── Doctors ─────────────────────────────────────────────────────────────────

export const apiGetDoctors = () =>
  request<Doctor[]>("/api/v1/doctors/");

// ─── Patients ────────────────────────────────────────────────────────────────

export const apiGetMe = () =>
  request<PatientMe>("/api/v1/patients/me/");

export const apiOnboard = (doctor_id: number) =>
  request<{ detail: string; patient: Record<string, unknown> }>("/api/v1/patients/onboard/", {
    method: "POST",
    body: JSON.stringify({ doctor_id }),
  });

// ─── Vitals ──────────────────────────────────────────────────────────────────

export const apiGetVitals = () =>
  request<VitalsLog[]>("/api/v1/vitals/");

export const apiGetAiInsight = (id: number) =>
  request<AiInsightResponse>(`/api/v1/vitals/${id}/ai-insight/`, {
    method: "POST",
  });

export const apiDownloadReport = (id: number) =>
  request<Blob>(`/api/v1/vitals/${id}/report.pdf`);

export const apiSendReport = (id: number) =>
  request<SendReportResponse>(`/api/v1/vitals/${id}/send-report/`, {
    method: "POST",
  });
