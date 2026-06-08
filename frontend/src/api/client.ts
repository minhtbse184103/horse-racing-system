import { API_BASE } from "../configs/appConfig";
import { adminState } from "../states/adminState";
import type { ApiObject } from "../lib/types";

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminState.token) headers.Authorization = `Bearer ${adminState.token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = parseJson(await response.text());

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null
        ? String((body as ApiObject).message || (body as ApiObject).error || response.statusText)
        : String(body || response.statusText);
    throw new Error(message);
  }

  return body as T;
}
