export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";

export type RoleName = "ADMIN" | "OWNER" | "JOCKEY" | "REFEREE" | "SPECTATOR";

export type UserResponse = {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  status: string;
  role: RoleName | string;
};

export type LoginResponse = {
  token: string;
  user: UserResponse;
};

export type Tournament = {
  tournamentId: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: string;
  createdBy?: number;
};

export type RaceCategory = {
  categoryId: number;
  categoryName: string;
  trackSurface?: string;
  minHorseAge?: number;
  allowedGender?: string;
  distanceText?: string;
  distanceMeter?: number;
  distanceType?: string;
  description?: string;
};

export type Race = {
  raceId: number;
  tournamentId: number;
  categoryId: number;
  scheduledTime: string;
  raceNumber?: number;
  maxParticipants: number;
  laneCount: number;
  prizePool: number;
  status: string;
};

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, extractErrorMessage(data, response.statusText));
  }

  return data as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    return String(record.message ?? record.error ?? record.detail ?? fallback);
  }
  return fallback || "Request failed";
}

export const api = {
  login: (body: { email: string; password: string }) =>
    request<LoginResponse>("/api/auth/login", { method: "POST", body }),
  signup: (body: { email: string; fullName: string; phone: string; password: string; roleName: string }) =>
    request<UserResponse>("/api/auth/signup", { method: "POST", body }),
  me: (token: string) => request<UserResponse>("/api/user/me", { token }),
  users: (token: string) => request<UserResponse[]>("/api/admin/users", { token }),
  createUser: (token: string, body: { email: string; fullName: string; phone: string; password: string; roleName: string }) =>
    request<UserResponse>("/api/admin/users", { method: "POST", token, body }),
  updateUser: (token: string, id: number, body: Partial<UserResponse> & { roleName?: string }) =>
    request<UserResponse>(`/api/admin/users/${id}`, { method: "PUT", token, body }),
  deleteUser: (token: string, id: number) =>
    request<void>(`/api/admin/users/${id}`, { method: "DELETE", token }),
  raceCategories: () => request<RaceCategory[]>("/api/race-categories"),
  tournaments: () => request<Tournament[]>("/api/tournaments"),
  createTournament: (token: string, body: TournamentFormPayload) =>
    request<Tournament>("/api/tournaments", { method: "POST", token, body }),
  updateTournament: (token: string, id: number, body: TournamentFormPayload) =>
    request<Tournament>(`/api/tournaments/${id}`, { method: "PUT", token, body }),
  deleteTournament: (token: string, id: number) =>
    request<Tournament>(`/api/tournaments/${id}`, { method: "DELETE", token }),
  races: () => request<Race[]>("/api/races"),
  createRace: (token: string, body: RaceFormPayload) =>
    request<Race>("/api/races", { method: "POST", token, body }),
  updateRace: (token: string, id: number, body: Omit<RaceFormPayload, "tournamentId">) =>
    request<Race>(`/api/races/${id}`, { method: "PUT", token, body }),
  deleteRace: (token: string, id: number) => request<Race>(`/api/races/${id}`, { method: "DELETE", token }),
};

export type TournamentFormPayload = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
};

export type RaceFormPayload = {
  tournamentId: number;
  categoryId: number;
  scheduledTime: string;
  maxParticipants: number;
  laneCount: number;
  prizePool: number;
};
