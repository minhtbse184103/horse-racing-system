import { createRace, createTournament } from "../api/adminApi";
import type { ApiObject } from "../lib/types";

export function submitAdminCreate(endpoint: string, payload: ApiObject): Promise<ApiObject> {
  if (endpoint === "/api/tournaments") return createTournament(payload);
  if (endpoint === "/api/races") return createRace(payload);
  throw new Error("Backend chua ho tro endpoint nay.");
}
