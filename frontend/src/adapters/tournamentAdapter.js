import API_BASE_URL from '../configs/apiConfig';

function toDateInputValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function adaptCondition(condition) {
  return {
    id: condition.conditionId,
    type: condition.conditionType,
    operator: condition.operator,
    value: condition.value,
    minValue: condition.minValue == null ? null : toNumber(condition.minValue),
    maxValue: condition.maxValue == null ? null : toNumber(condition.maxValue)
  };
}

function adaptRace(race) {
  const prizes = [...(race.prizes || [])]
    .sort((left, right) => left.rankPosition - right.rankPosition)
    .map((prize) => ({
      amount: toNumber(prize.amount),
      ownerPercent: toNumber(prize.ownerPercent, 80),
      jockeyPercent: toNumber(prize.jockeyPercent, 20)
    }));

  return {
    id: race.raceId,
    name: race.raceName || '',
    track: race.trackName || '',
    raceStartTime: race.raceStartTime || '',
    raceEndTime: race.raceEndTime || '',
    distance: toNumber(race.distance),
    maxRunners: toNumber(race.maxRunners),
    raceOrder: race.raceOrder,
    entries: toNumber(race.entryCount),
    availableStalls: toNumber(race.availableStalls),
    status: race.status || 'OPEN_FOR_REGISTRATION',
    prizes
  };
}

export function adaptTournament(tournament, races = []) {
  const venueImageUrl = tournament.venueImageUrl || tournament.venueImagePath || '';

  return {
    id: tournament.tournamentId,
    name: tournament.tournamentName || '',
    description: tournament.description || '',
    venue: tournament.venue || '',
    venueImageUrl,
    venueImageSrc: resolveVenueImageUrl(venueImageUrl),
    venueImageFile: null,
    venueImageRemoved: false,
    registrationOpen: toDateInputValue(tournament.registrationOpenAt),
    registrationClose: toDateInputValue(tournament.registrationCloseAt),
    start: toDateInputValue(tournament.startDate),
    end: toDateInputValue(tournament.endDate),
    maxRegistration: toNumber(tournament.maxRegistrations),
    entryFee: toNumber(tournament.entryFee),
    registrationCount: toNumber(tournament.registrationCount),
    approvedRegistrationCount: toNumber(tournament.approvedRegistrationCount),
    raceCount: toNumber(tournament.raceCount),
    status: tournament.status || 'OPEN_FOR_REGISTRATION',
    conditions: (tournament.conditions || []).map(adaptCondition),
    races: races.map(adaptRace)
  };
  function resolveVenueImageUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
}
