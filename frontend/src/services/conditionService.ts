import { getTournamentConditions } from "../api/adminApi";
import type { ApiObject } from "../lib/types";

export async function loadConditions(): Promise<ApiObject[]> {
  try {
    return await getTournamentConditions();
  } catch {
    return [];
  }
}
