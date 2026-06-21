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
    distance: Number(race.distance),
    maxRunners: Number(race.maxRunners),
    raceOrder,
    prizes: toPrizeRequests(race.prizes)
  };
}

export function toCreateRaceRequest(race, tournamentId, raceOrder) {
  return {
    tournamentId: Number(tournamentId),
    ...toRaceRequest(race, raceOrder)
  };
}

export function toUpdateRaceRequest(race, raceOrder) {
  return toRaceRequest(race, raceOrder);
}

export function isPersistedRace(race) {
  return Number.isInteger(race.id) && race.id > 0;
}
