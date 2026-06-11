import { httpRequest } from '../api/httpClient';

export function createRaceEntry(payload) {
  return httpRequest('/api/admin/race-entries', {
    method: 'POST',
    body: payload
  });
}

export function getRaceEntriesByRace(raceId) {
  return httpRequest(`/api/admin/race-entries/by-race/${raceId}`);
}