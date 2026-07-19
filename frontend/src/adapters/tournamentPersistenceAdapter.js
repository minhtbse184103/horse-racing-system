function toRegistrationDateTime(value, endOfDay = false) {
  if (!value) return null;
  if (String(value).includes('T')) return value;
  return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`;
}

function toConditionRequest(condition) {
  return {
    conditionType: condition.type,
    operator: condition.operator,
    value: condition.value == null ? null : String(condition.value),
    minValue: condition.minValue == null ? null : Number(condition.minValue),
    maxValue: condition.maxValue == null ? null : Number(condition.maxValue)
  };
}

function toPrizeRequests(prizes) {
  return prizes.map((prize, index) => ({
    rankPosition: index + 1,
    amount: Number(prize.amount),
    ownerPercent: Number(prize.ownerPercent),
    jockeyPercent: Number(prize.jockeyPercent)
  }));
}

export function toTournamentRequest(tournament) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 2A/8 - Adapter maps Tournament-level edit fields and Conditions to the update DTO.
  // Purpose: map editable Tournament-level fields and Conditions to the backend update DTO.
  return {
    tournamentName: tournament.name.trim(),
    description: tournament.description?.trim() || null,
    venue: tournament.venue.trim(),
    registrationOpenAt: toRegistrationDateTime(tournament.registrationOpen),
    registrationCloseAt: toRegistrationDateTime(tournament.registrationClose, true),
    startDate: tournament.start,
    endDate: tournament.end,
    maxRegistrations: Number(tournament.maxRegistration),
    entryFee: Number(tournament.entryFee),
    conditions: tournament.conditions.map(toConditionRequest)
  };
}

function toRaceRequest(race, raceOrder) {
  return {
    raceName: race.name.trim(),
    trackName: race.track.trim(),
    raceStartTime: race.raceStartTime,
    raceEndTime: race.raceEndTime,
    entryFinalizationScheduledAt: race.entryFinalizationScheduledAt || null,
    distance: Number(race.distance),
    maxRunners: Number(race.maxRunners),
    raceOrder,
    prizes: toPrizeRequests(race.prizes)
  };
}

export function toCreateRaceRequest(race, tournamentId, raceOrder) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 2B/8 - Adapter maps a newly added Race draft to the standalone create Race DTO.
  // Purpose: map a newly added Race in the edit wizard to the standalone Race create DTO.
  return {
    tournamentId: Number(tournamentId),
    ...toRaceRequest(race, raceOrder)
  };
}

export function toCreateTournamentProgramRequest(tournament) {
  // FLOW: Admin Create Tournament Program
  // ORDER: 3/8 - Adapter converts wizard state into the backend program-create request shape.
  // Purpose: shape the wizard draft into the backend atomic create contract: one Tournament payload plus initial Race/RacePrize drafts.
  return {
    tournament: toTournamentRequest(tournament),
    races: tournament.races.map((race, index) =>
      toRaceRequest(race, Number(race.raceOrder || index + 1))
    )
  };
}

export function toUpdateRaceRequest(race, raceOrder) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 2C/8 - Adapter maps an existing Race draft to the standalone update Race DTO.
  // Purpose: map an existing Race edit to the standalone Race update DTO.
  return toRaceRequest(race, raceOrder);
}

export function isPersistedRace(race) {
  return Number.isInteger(race.id) && race.id > 0;
}
