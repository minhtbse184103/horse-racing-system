import type { Race, RaceFormPayload, Tournament, TournamentFormPayload } from "../../core/lib/api";

const editableTournamentStatuses = new Set(["Draft"]);
const raceSetupTournamentStatuses = new Set(["Draft", "OpenForRegistration", "ClosedRegistration"]);

export function validateTournamentForm(
  form: TournamentFormPayload,
  tournaments: Tournament[],
  currentId?: number,
) {
  const errors: string[] = [];
  const name = form.name.trim();
  const location = form.location.trim();

  if (!name) errors.push("Tournament name is required.");
  if (!location) errors.push("Location is required.");
  if (!form.startDate) errors.push("Start date is required.");
  if (!form.endDate) errors.push("End date is required.");
  if (!form.registrationDeadline) errors.push("Registration deadline is required.");
  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    errors.push("Start date must be on or before end date.");
  }
  if (form.registrationDeadline && form.startDate && form.registrationDeadline > form.startDate) {
    errors.push("Registration deadline must be on or before start date.");
  }

  const duplicate = tournaments.find((item) =>
    item.tournamentId !== currentId &&
    item.status !== "Cancelled" &&
    item.location.trim().toLowerCase() === location.toLowerCase() &&
    item.startDate === form.startDate &&
    item.endDate === form.endDate,
  );

  if (duplicate) errors.push("A non-cancelled tournament already exists at this location and date range.");

  return errors;
}

export function canEditTournament(tournament: Tournament) {
  return editableTournamentStatuses.has(tournament.status);
}

export function canChangeRaceForTournament(tournament?: Tournament) {
  return Boolean(tournament && raceSetupTournamentStatuses.has(tournament.status));
}

export function validateRaceForm(
  form: RaceFormPayload,
  races: Race[],
  tournaments: Tournament[],
  currentId?: number,
) {
  const errors: string[] = [];
  const tournament = tournaments.find((item) => item.tournamentId === form.tournamentId);

  if (!form.tournamentId) errors.push("Tournament is required.");
  if (!form.categoryId) errors.push("Race category is required.");
  if (!form.scheduledTime) errors.push("Scheduled time is required.");
  if (!Number.isFinite(form.maxParticipants) || form.maxParticipants <= 0) errors.push("Max participants must be positive.");
  if (!Number.isFinite(form.laneCount) || form.laneCount <= 0) errors.push("Lane count must be positive.");
  if (form.laneCount > form.maxParticipants) errors.push("Lane count cannot exceed max participants.");
  if (!Number.isFinite(form.prizePool) || form.prizePool < 0) errors.push("Prize pool must be zero or greater.");

  if (!canChangeRaceForTournament(tournament)) {
    errors.push("Race setup is allowed only when tournament status is Draft, OpenForRegistration, or ClosedRegistration.");
  }

  if (tournament && form.scheduledTime) {
    const dateOnly = form.scheduledTime.slice(0, 10);
    if (dateOnly < tournament.startDate || dateOnly > tournament.endDate) {
      errors.push("Race scheduled date must be inside tournament date range.");
    }
  }

  const duplicateTime = races.find((race) =>
    race.raceId !== currentId &&
    race.tournamentId === form.tournamentId &&
    race.status !== "Cancelled" &&
    normalizeMinute(race.scheduledTime) === normalizeMinute(form.scheduledTime),
  );

  if (duplicateTime) {
    errors.push("Active races in the same tournament cannot share the same scheduled time.");
  }

  return errors;
}

export function canEditRace(race: Race, tournament?: Tournament) {
  return race.status === "Draft" && canChangeRaceForTournament(tournament);
}

function normalizeMinute(value: string) {
  return value ? value.slice(0, 16) : "";
}
