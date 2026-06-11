import type {
  Horse, Jockey, Owner, Referee, Tournament, Race, Registration, RaceResult, Prediction
} from "./types";

export const owners: Owner[] = [
  { id: "o1", name: "Isabella Hartwell", stable: "Hartwell Stables" },
  { id: "o2", name: "Marcus Chen", stable: "Silver Crest Ranch" },
  { id: "o3", name: "Amara Okafor", stable: "Goldenfield Stud" },
];

export const referees: Referee[] = [
  { id: "r1", name: "Henrik Vossberg", license: "REF-2018-441" },
  { id: "r2", name: "Diana Kostova", license: "REF-2020-117" },
];

export const horses: Horse[] = [
  { id: "h1", name: "Midnight Aurora", breed: "Thoroughbred", age: 5, weight: 478, certExpiry: "2026-09-12", ownerId: "o1", status: "Active", speedRating: 92, stamina: 88, injuryHistory: [], wins: 7, top3Finishes: 14, bestFinishTime: 71.4, trainingStatus: "Peak" },
  { id: "h2", name: "Stormcaller", breed: "Arabian", age: 4, weight: 442, certExpiry: "2026-12-01", ownerId: "o1", status: "Active", speedRating: 89, stamina: 94, injuryHistory: ["Minor fetlock 2024"], wins: 5, top3Finishes: 11, bestFinishTime: 72.1, trainingStatus: "Good" },
  { id: "h3", name: "Iron Sonata", breed: "Quarter Horse", age: 6, weight: 512, certExpiry: "2025-11-04", ownerId: "o2", status: "Active", speedRating: 85, stamina: 80, injuryHistory: [], wins: 9, top3Finishes: 17, bestFinishTime: 73.0, trainingStatus: "Peak" },
  { id: "h4", name: "Velvet Mirage", breed: "Thoroughbred", age: 7, weight: 495, certExpiry: "2024-03-22", ownerId: "o2", status: "Active", speedRating: 78, stamina: 75, injuryHistory: ["Tendon strain 2023"], wins: 3, top3Finishes: 8, bestFinishTime: 74.6, trainingStatus: "Recovering" },
  { id: "h5", name: "Crimson Vow", breed: "Akhal-Teke", age: 5, weight: 460, certExpiry: "2026-06-30", ownerId: "o3", status: "Active", speedRating: 91, stamina: 90, injuryHistory: [], wins: 6, top3Finishes: 12, bestFinishTime: 71.8, trainingStatus: "Peak" },
  { id: "h6", name: "Northwind", breed: "Arabian", age: 8, weight: 455, certExpiry: "2026-08-14", ownerId: "o3", status: "Injured", speedRating: 82, stamina: 79, injuryHistory: ["Hock injury 2025"], wins: 4, top3Finishes: 9, bestFinishTime: 73.4, trainingStatus: "Rest" },
];

export const jockeys: Jockey[] = [
  { id: "j1", license: "JCK-001", name: "Élise Marchetti", weight: 54, ranking: 1, status: "Active", racesThisWeek: 2, wins: 22, podiumFinishes: 47, violationCount: 0, bestFinishTime: 71.2 },
  { id: "j2", license: "JCK-002", name: "Tomás Reyes", weight: 56, ranking: 3, status: "Active", racesThisWeek: 3, wins: 17, podiumFinishes: 38, violationCount: 1, bestFinishTime: 71.9 },
  { id: "j3", license: "JCK-003", name: "Priya Anand", weight: 52, ranking: 2, status: "Active", racesThisWeek: 1, wins: 19, podiumFinishes: 42, violationCount: 0, bestFinishTime: 71.5 },
  { id: "j4", license: "JCK-004", name: "Kofi Mensah", weight: 58, ranking: 5, status: "Active", racesThisWeek: 0, wins: 12, podiumFinishes: 28, violationCount: 2, bestFinishTime: 72.4 },
];

const t1Id = "t1";
export const tournaments: Tournament[] = [
  {
    id: t1Id,
    name: "Aurelian Grand Cup 2026",
    category: "Open International",
    location: "Vallière Hippodrome, France",
    startDate: "2026-06-01",
    endDate: "2026-06-14",
    status: "Ongoing",
    description: "Two weeks of the world's most prestigious flat racing across three classes.",
    rounds: [
      { id: "rd1", roundName: "Opening Round", roundDate: "2026-06-02" },
      { id: "rd2", roundName: "Semi-Finals", roundDate: "2026-06-08" },
      { id: "rd3", roundName: "Grand Final", roundDate: "2026-06-14" },
    ],
  },
  {
    id: "t2",
    name: "Silver Crest Invitational",
    category: "Regional",
    location: "Bridgewater Downs, USA",
    startDate: "2026-07-20",
    endDate: "2026-07-22",
    status: "Upcoming",
    description: "Invitational meet featuring Professional and Elite class entries.",
    rounds: [{ id: "rd4", roundName: "Single Round", roundDate: "2026-07-21" }],
  },
];

export const races: Race[] = [
  { id: "rc1", tournamentId: t1Id, roundId: "rd1", order: 1, category: "Sprint", raceClass: "Professional", track: "Track A", laneCount: 6, dateTime: "2026-06-02T14:00:00Z", distance: 1200, maxHorseWeight: 500, status: "Completed", refereeId: "r1", refereeReportSubmitted: true, prizePool: 50000 },
  { id: "rc2", tournamentId: t1Id, roundId: "rd1", order: 2, category: "Middle", raceClass: "Elite", track: "Track B", laneCount: 6, dateTime: "2026-06-02T16:30:00Z", distance: 1800, maxHorseWeight: 510, status: "Completed", refereeId: "r2", refereeReportSubmitted: true, prizePool: 120000 },
  { id: "rc3", tournamentId: t1Id, roundId: "rd2", order: 1, category: "Sprint", raceClass: "Professional", track: "Track A", laneCount: 6, dateTime: "2026-06-08T14:00:00Z", distance: 1400, maxHorseWeight: 500, status: "Live", refereeId: "r1", refereeReportSubmitted: false, prizePool: 75000 },
  { id: "rc4", tournamentId: t1Id, roundId: "rd2", order: 2, category: "Distance", raceClass: "Elite", track: "Track C", laneCount: 6, dateTime: "2026-06-08T17:00:00Z", distance: 2400, maxHorseWeight: 510, status: "RegistrationClosed", refereeId: "r2", refereeReportSubmitted: false, prizePool: 150000 },
  { id: "rc5", tournamentId: t1Id, roundId: "rd3", order: 1, category: "Grand Final", raceClass: "Elite", track: "Track A", laneCount: 6, dateTime: "2026-06-14T15:00:00Z", distance: 2000, maxHorseWeight: 510, status: "RegistrationOpen", refereeId: "r1", refereeReportSubmitted: false, prizePool: 500000 },
  { id: "rc6", tournamentId: "t2", roundId: "rd4", order: 1, category: "Sprint", raceClass: "Beginner", track: "Track A", laneCount: 6, dateTime: "2026-07-21T13:00:00Z", distance: 1000, maxHorseWeight: 460, status: "Scheduled", refereeReportSubmitted: false, prizePool: 15000 },
];

export const registrations: Registration[] = [
  // Completed race rc1
  { id: "reg1", raceId: "rc1", horseId: "h1", jockeyId: "j1", lane: 1, registeredAt: "2026-05-28T09:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  { id: "reg2", raceId: "rc1", horseId: "h2", jockeyId: "j2", lane: 2, registeredAt: "2026-05-28T10:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  { id: "reg3", raceId: "rc1", horseId: "h5", jockeyId: "j3", lane: 3, registeredAt: "2026-05-28T11:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  { id: "reg4", raceId: "rc1", horseId: "h3", jockeyId: "j4", lane: 4, registeredAt: "2026-05-28T12:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  // rc2
  { id: "reg5", raceId: "rc2", horseId: "h1", jockeyId: "j1", lane: 1, registeredAt: "2026-05-29T09:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  { id: "reg6", raceId: "rc2", horseId: "h3", jockeyId: "j2", lane: 2, registeredAt: "2026-05-29T10:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  { id: "reg7", raceId: "rc2", horseId: "h5", jockeyId: "j3", lane: 3, registeredAt: "2026-05-29T11:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  // rc3 (live)
  { id: "reg8", raceId: "rc3", horseId: "h1", jockeyId: "j1", lane: 1, registeredAt: "2026-06-04T09:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  { id: "reg9", raceId: "rc3", horseId: "h2", jockeyId: "j3", lane: 2, registeredAt: "2026-06-04T10:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  { id: "reg10", raceId: "rc3", horseId: "h5", jockeyId: "j2", lane: 3, registeredAt: "2026-06-04T11:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  // rc5 pending — with warnings
  { id: "reg11", raceId: "rc5", horseId: "h4", jockeyId: "j2", lane: 1, registeredAt: "2026-06-10T11:00:00Z", status: "Pending", invitationStatus: "Pending", warnings: ["Health certificate expired (2024-03-22)"] },
  { id: "reg12", raceId: "rc5", horseId: "h3", jockeyId: "j2", lane: 2, registeredAt: "2026-06-10T12:00:00Z", status: "Pending", invitationStatus: "Accepted", warnings: ["Horse exceeds class weight limit (512kg > 510kg)"] },
  { id: "reg13", raceId: "rc5", horseId: "h1", jockeyId: "j1", lane: 3, registeredAt: "2026-06-10T13:00:00Z", status: "Pending", invitationStatus: "Accepted" },
  // rc4 closed
  { id: "reg14", raceId: "rc4", horseId: "h5", jockeyId: "j3", lane: 1, registeredAt: "2026-06-05T09:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  { id: "reg15", raceId: "rc4", horseId: "h1", jockeyId: "j1", lane: 2, registeredAt: "2026-06-05T10:00:00Z", status: "Approved", invitationStatus: "Accepted" },
  // rc6 invitation pending to j4
  { id: "reg16", raceId: "rc6", horseId: "h2", jockeyId: "j4", lane: 1, registeredAt: "2026-07-15T09:00:00Z", status: "Pending", invitationStatus: "Pending" },
];

export const raceResults: RaceResult[] = [
  // rc1 — confirmed
  { id: "res1", raceId: "rc1", horseId: "h1", jockeyId: "j1", lane: 1, finishTime: 71.4, raceScore: 0, rank: 1, violationFlag: false, confirmed: true },
  { id: "res2", raceId: "rc1", horseId: "h5", jockeyId: "j3", lane: 3, finishTime: 71.9, raceScore: 0, rank: 2, violationFlag: false, confirmed: true },
  { id: "res3", raceId: "rc1", horseId: "h2", jockeyId: "j2", lane: 2, finishTime: 72.5, raceScore: 0, rank: 3, violationFlag: false, confirmed: true },
  { id: "res4", raceId: "rc1", horseId: "h3", jockeyId: "j4", lane: 4, finishTime: 73.8, raceScore: 0, rank: 4, violationFlag: true, confirmed: true },
  // rc2 — confirmed
  { id: "res5", raceId: "rc2", horseId: "h5", jockeyId: "j3", lane: 3, finishTime: 108.2, raceScore: 0, rank: 1, violationFlag: false, confirmed: true },
  { id: "res6", raceId: "rc2", horseId: "h1", jockeyId: "j1", lane: 1, finishTime: 108.9, raceScore: 0, rank: 2, violationFlag: false, confirmed: true },
  { id: "res7", raceId: "rc2", horseId: "h3", jockeyId: "j2", lane: 2, finishTime: 110.4, raceScore: 0, rank: 3, violationFlag: false, confirmed: true },
];

export const predictions: Prediction[] = [
  { id: "p1", raceId: "rc5", horseId: "h1", confidence: 78, predictedRank: 1 },
  { id: "p2", raceId: "rc5", horseId: "h5", confidence: 71, predictedRank: 2 },
  { id: "p3", raceId: "rc5", horseId: "h3", confidence: 54, predictedRank: 3 },
];
