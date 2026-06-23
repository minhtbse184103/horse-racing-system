import {
  DEFAULT_RACE_DISTANCE,
  DEFAULT_RACE_MAX_RUNNERS,
  DEFAULT_RACE_PRIZES
} from '../components/admin/events/wizard/wizardConstants';

function createTemporaryId() {
  return Math.random().toString(36).slice(2, 9);
}

function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const text = String(value);
  return text.length > 16 ? text.slice(0, 16) : text;
}

function addOneHour(dateTimeLocal) {
  if (!dateTimeLocal) return '';

  const date = new Date(dateTimeLocal);
  if (Number.isNaN(date.getTime())) return '';

  date.setHours(date.getHours() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function normalizeRunner(runner) {
  return {
    horseName: runner?.horseName || '',
    jockeyName: runner?.jockeyName || ''
  };
}

function getExistingNames(races) {
  return new Set(
    races
      .map((race) => String(race.name || '').trim().toLowerCase())
      .filter(Boolean)
  );
}

function makeUniqueName(baseName, existingRaces) {
  const existingNames = getExistingNames(existingRaces);
  const fallback = 'OurHub Race';
  const normalizedBase = String(baseName || fallback).trim() || fallback;

  if (!existingNames.has(normalizedBase.toLowerCase())) {
    return normalizedBase;
  }

  let suffix = 2;
  let candidate = `${normalizedBase} - Import ${suffix}`;

  while (existingNames.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${normalizedBase} - Import ${suffix}`;
  }

  return candidate;
}

function nextRaceOrder(existingRaces) {
  const usedOrders = new Set(
    existingRaces
      .map((race) => Number(race.raceOrder))
      .filter((order) => Number.isInteger(order) && order > 0)
  );

  let order = 1;
  while (usedOrders.has(order)) {
    order += 1;
  }

  return order;
}

export function normalizeOurHubRacecardToPreview(raw) {
  return {
    externalRaceId: raw?.externalRaceId || null,
    raceName: raw?.raceName || '',
    courseName: raw?.courseName || '',
    raceDate: raw?.raceDate || '',
    raceTime: raw?.raceTime || '',
    raceStartTime: toDateTimeLocal(raw?.raceStartTime),
    distanceText: raw?.distanceText || '',
    distanceMeters: isPositiveNumber(raw?.distanceMeters) ? Number(raw.distanceMeters) : null,
    runnerCount: isPositiveNumber(raw?.runnerCount) ? Number(raw.runnerCount) : null,
    runners: Array.isArray(raw?.runners) ? raw.runners.map(normalizeRunner) : []
  };
}

export function ourHubPreviewToRaceDraft(preview, context = {}) {
  const existingRaces = Array.isArray(context.existingRaces) ? context.existingRaces : [];
  const normalizedPreview = normalizeOurHubRacecardToPreview(preview);
  const baseName = normalizedPreview.raceName
    || [normalizedPreview.courseName, normalizedPreview.raceTime].filter(Boolean).join(' ');
  const raceStartTime = normalizedPreview.raceStartTime;

  return {
    id: `ourhub-race-${createTemporaryId()}`,
    name: makeUniqueName(baseName, existingRaces),
    track: normalizedPreview.courseName,
    raceStartTime,
    raceEndTime: addOneHour(raceStartTime),
    distance: normalizedPreview.distanceMeters || DEFAULT_RACE_DISTANCE,
    maxRunners: normalizedPreview.runnerCount || DEFAULT_RACE_MAX_RUNNERS,
    entries: 0,
    status: 'OPEN_FOR_REGISTRATION',
    prizes: DEFAULT_RACE_PRIZES.map((prize) => ({ ...prize })),
    raceOrder: nextRaceOrder(existingRaces),
    externalProvider: 'OURHUB',
    externalRaceId: normalizedPreview.externalRaceId,
    externalPreview: normalizedPreview
  };
}
