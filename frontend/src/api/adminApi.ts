import { api } from "./client";
import type { ApiObject, LoginResponse } from "../lib/types";

export function loginAdmin(email: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getTournamentConditions(): Promise<ApiObject[]> {
  return api<ApiObject[]>("/api/tournament-conditions");
}

export function createTournament(payload: ApiObject): Promise<ApiObject> {
  return api<ApiObject>("/api/tournaments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createRace(payload: ApiObject): Promise<ApiObject> {
  return api<ApiObject>("/api/races", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
