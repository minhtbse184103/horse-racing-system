import type { Horse, Jockey, Race, Registration, RaceResult } from "./types";

export function weightFactor(weight: number): number {
  if (weight <= 450) return 1.0;
  if (weight <= 500) return 1.1;
  return 1.2;
}

export function calcRaceScore(finishTimeSec: number, distanceMeters: number, horseWeight: number): number {
  return +(finishTimeSec * (distanceMeters / 1000) * weightFactor(horseWeight)).toFixed(3);
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(2);
  return m > 0 ? `${m}:${s.padStart(5, "0")}` : `${s}s`;
}

export function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 36e5;
}

export interface EligibilityIssue { kind: "error" | "warning"; message: string; }

export function validateRegistration(horse: Horse, jockey: Jockey, race: Race, allRegs: Registration[]): EligibilityIssue[] {
  const issues: EligibilityIssue[] = [];
  if (new Date(horse.certExpiry) < new Date(race.dateTime)) {
    issues.push({ kind: "error", message: `Health certificate expired on ${horse.certExpiry}` });
  }
  if (horse.weight > race.maxHorseWeight) {
    issues.push({ kind: "error", message: `Horse weight ${horse.weight}kg exceeds class limit ${race.maxHorseWeight}kg` });
  }
  if (horse.status !== "Active") {
    issues.push({ kind: "error", message: `Horse status is ${horse.status}` });
  }
  // Registration window 48h
  const hrs = hoursUntil(race.dateTime);
  if (hrs < 48 && hrs > 0) {
    issues.push({ kind: "warning", message: `Registration closes in ${hrs.toFixed(1)}h (under 48h window)` });
  }
  if (hrs <= 0) {
    issues.push({ kind: "error", message: "Registration closed (race already started)" });
  }
  // Jockey overload same day
  const sameDay = allRegs.filter(r => r.jockeyId === jockey.id && r.status !== "Rejected" && sameYMD(r.registeredAt, race.dateTime));
  if (sameDay.length >= 3) {
    issues.push({ kind: "error", message: `Jockey already at 3 rides this day` });
  }
  return issues;
}

function sameYMD(a: string, b: string) {
  return a.slice(0, 10) === b.slice(0, 10);
}

export interface LeaderboardRow {
  horseId: string;
  horseName: string;
  jockeyId: string;
  jockeyName: string;
  totalScore: number;
  bestTime: number;
  races: number;
  wins: number;
}

export function calculateLeaderboard(
  tournamentRaceIds: string[],
  results: RaceResult[],
  horses: Horse[],
  jockeys: Jockey[],
  races: Race[]
): LeaderboardRow[] {
  const map = new Map<string, LeaderboardRow>();
  for (const res of results) {
    if (!res.confirmed) continue;
    if (!tournamentRaceIds.includes(res.raceId)) continue;
    const race = races.find(r => r.id === res.raceId);
    const horse = horses.find(h => h.id === res.horseId);
    const jockey = jockeys.find(j => j.id === res.jockeyId);
    if (!race || !horse || !jockey) continue;
    const score = calcRaceScore(res.finishTime, race.distance, horse.weight);
    const key = horse.id;
    const row = map.get(key) ?? {
      horseId: horse.id, horseName: horse.name,
      jockeyId: jockey.id, jockeyName: jockey.name,
      totalScore: 0, bestTime: Infinity, races: 0, wins: 0,
    };
    row.totalScore = +(row.totalScore + score).toFixed(3);
    row.bestTime = Math.min(row.bestTime, res.finishTime);
    row.races += 1;
    if (res.rank === 1) row.wins += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.totalScore - b.totalScore || a.bestTime - b.bestTime);
}

export function detectScheduleConflicts(races: Race[], regs: Registration[]) {
  const conflicts: { type: string; message: string }[] = [];
  // Same jockey same datetime
  const byJockeyDate = new Map<string, string[]>();
  for (const r of regs) {
    if (r.status === "Rejected") continue;
    const race = races.find(x => x.id === r.raceId);
    if (!race) continue;
    const k = `${r.jockeyId}|${race.dateTime}`;
    byJockeyDate.set(k, [...(byJockeyDate.get(k) ?? []), race.id]);
  }
  for (const [k, raceIds] of byJockeyDate) {
    if (raceIds.length > 1) {
      const [jId] = k.split("|");
      conflicts.push({ type: "JockeyTimeConflict", message: `Jockey ${jId} double-booked across ${raceIds.length} races` });
    }
  }
  // Jockey overload per day
  const byJockeyDay = new Map<string, number>();
  for (const r of regs) {
    if (r.status === "Rejected") continue;
    const race = races.find(x => x.id === r.raceId);
    if (!race) continue;
    const k = `${r.jockeyId}|${race.dateTime.slice(0,10)}`;
    byJockeyDay.set(k, (byJockeyDay.get(k) ?? 0) + 1);
  }
  for (const [k, n] of byJockeyDay) {
    if (n > 3) {
      const [jId, day] = k.split("|");
      conflicts.push({ type: "JockeyOverload", message: `Jockey ${jId} has ${n} rides on ${day} (>3)` });
    }
  }
  return conflicts;
}
