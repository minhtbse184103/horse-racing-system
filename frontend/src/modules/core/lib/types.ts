// Domain types for Horse Racing Tournament Management
export type RaceClass = "Beginner" | "Professional" | "Elite";
export type TournamentStatus = "Upcoming" | "Ongoing" | "Completed";
export type RaceStatus = "Scheduled" | "RegistrationOpen" | "RegistrationClosed" | "Live" | "Completed" | "Finalized";
export type RegistrationStatus = "Pending" | "Approved" | "Rejected";
export type InvitationStatus = "Pending" | "Accepted" | "Rejected";
export type HorseStatus = "Active" | "Injured" | "Retired";
export type JockeyStatus = "Active" | "Suspended" | "Inactive";

export interface Horse {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number; // kg
  certExpiry: string; // ISO
  ownerId: string;
  status: HorseStatus;
  speedRating: number;
  stamina: number;
  injuryHistory: string[];
  wins: number;
  top3Finishes: number;
  bestFinishTime: number; // seconds
  trainingStatus: string;
}

export interface Jockey {
  id: string;
  license: string;
  name: string;
  weight: number;
  ranking: number;
  status: JockeyStatus;
  racesThisWeek: number;
  wins: number;
  podiumFinishes: number;
  violationCount: number;
  bestFinishTime: number;
}

export interface Owner { id: string; name: string; stable: string; }
export interface Referee { id: string; name: string; license: string; }

export interface Round { id: string; roundName: string; roundDate: string; }

export interface Race {
  id: string;
  tournamentId: string;
  roundId: string;
  order: number;
  category: string;
  raceClass: RaceClass;
  track: string;
  laneCount: number;
  dateTime: string;
  distance: number; // meters
  maxHorseWeight: number;
  status: RaceStatus;
  refereeId?: string;
  refereeReportSubmitted: boolean;
  prizePool: number;
}

export interface Tournament {
  id: string;
  name: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  description: string;
  rounds: Round[];
}

export interface Registration {
  id: string;
  raceId: string;
  horseId: string;
  jockeyId: string;
  lane: number;
  registeredAt: string;
  status: RegistrationStatus;
  invitationStatus: InvitationStatus;
  warnings?: string[];
}

export interface RaceResult {
  id: string;
  raceId: string;
  horseId: string;
  jockeyId: string;
  lane: number;
  finishTime: number; // seconds
  raceScore: number;
  rank: number;
  violationFlag: boolean;
  confirmed: boolean;
}

export interface Prediction {
  id: string;
  raceId: string;
  horseId: string;
  confidence: number; // 0-100
  predictedRank: number;
}
