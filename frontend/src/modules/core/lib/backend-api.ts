const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "trackside:backend-token";

export type BackendTournament = {
  tournamentId: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: string;
  createdBy?: number;
};

export type BackendRaceCategory = {
  categoryId: number;
  categoryName: string;
  trackSurface?: string | null;
  minHorseAge?: number | null;
  allowedGender?: string | null;
  distanceText?: string | null;
  distanceMeter?: number | null;
  distanceType?: string | null;
  description?: string | null;
};

export type BackendRace = {
  raceId: number;
  tournamentId: number;
  categoryId: number;
  scheduledTime: string;
  raceNumber?: number | null;
  maxParticipants: number;
  laneCount: number;
  prizePool: number;
  status: string;
};

export type BackendUser = {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  status: string;
  role: string;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export class BackendApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const data = text ? parseBody(text) : null;

  if (!response.ok) {
    throw new BackendApiError(response.status, getErrorMessage(data, response.statusText));
  }

  return data as T;
}

function parseBody(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    return String(record.message ?? record.error ?? record.detail ?? fallback);
  }
  return fallback || "Request failed";
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export async function login(email: string, password: string) {
  const response = await request<{ token: string; user: BackendUser }>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  setToken(response.token);
  return response;
}

export const backendApi = {
  tournaments: () => request<BackendTournament[]>("/api/tournaments", { auth: false }),
  createTournament: (body: {
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
  }) => request<BackendTournament>("/api/tournaments", { method: "POST", body }),
  updateTournament: (
    id: number,
    body: { name: string; location: string; startDate: string; endDate: string; registrationDeadline: string },
  ) => request<BackendTournament>(`/api/tournaments/${id}`, { method: "PUT", body }),
  cancelTournament: (id: number) => request<BackendTournament>(`/api/tournaments/${id}`, { method: "DELETE" }),
  raceCategories: () => request<BackendRaceCategory[]>("/api/race-categories", { auth: false }),
  races: () => request<BackendRace[]>("/api/races", { auth: false }),
  createRace: (body: {
    tournamentId: number;
    categoryId: number;
    scheduledTime: string;
    maxParticipants: number;
    laneCount: number;
    prizePool: number;
  }) => request<BackendRace>("/api/races", { method: "POST", body }),
  updateRace: (
    id: number,
    body: {
      categoryId: number;
      scheduledTime: string;
      maxParticipants: number;
      laneCount: number;
      prizePool: number;
    },
  ) => request<BackendRace>(`/api/races/${id}`, { method: "PUT", body }),
  cancelRace: (id: number) => request<BackendRace>(`/api/races/${id}`, { method: "DELETE" }),
  users: () => request<BackendUser[]>("/api/admin/users"),
  createUser: (body: { email: string; fullName: string; phone: string; password: string; roleName: string }) =>
    request<BackendUser>("/api/admin/users", { method: "POST", body }),
  updateUser: (
    id: number,
    body: { email: string; fullName: string; phone: string; roleName: string; status: string },
  ) => request<BackendUser>(`/api/admin/users/${id}`, { method: "PUT", body }),
  deleteUser: (id: number) => request<void>(`/api/admin/users/${id}`, { method: "DELETE" }),
};
