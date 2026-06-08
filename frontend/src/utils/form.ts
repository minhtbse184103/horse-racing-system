import type { ApiObject } from "../lib/types";

export function serializeForm(form: HTMLFormElement): ApiObject {
  const numericFields = new Set([
    "conditionId",
    "minParticipants",
    "maxParticipants",
    "roundId",
    "distance",
    "tournamentId",
    "roundOrder",
  ]);
  const payload: ApiObject = {};

  new FormData(form).forEach((value, key) => {
    const text = String(value);
    if (!text) return;
    payload[key] = numericFields.has(key) ? Number(text) : text;
  });

  return payload;
}
