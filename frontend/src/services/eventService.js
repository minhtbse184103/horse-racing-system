import { httpRequest } from '../api/httpClient';

export function getTournamentConditions() {
  return httpRequest('/api/tournament-conditions');
}

export function getTournaments() {
  return httpRequest('/api/tournaments');
}

export function getRaces() {
  return httpRequest('/api/races');
}

// FLOW: Admin Tournament Workspace Read
// ORDER: 2/7 - Frontend service sends the single aggregate workspace request.
// FE path: TournamentWorkspace -> useTournamentWorkspace.
// Purpose: fetch the backend aggregate endpoint so the UI does not issue per-Tournament/per-Race detail requests.
export function getTournamentWorkspace() {
  return httpRequest('/api/admin/tournaments/workspace');
}

export function getPublicTournaments() {
  return httpRequest('/api/tournaments', { auth: false });
}

export function getPublicTournamentConditions() {
  return httpRequest('/api/tournament-conditions', { auth: false });
}

export function getPublicRaces() {
  return httpRequest('/api/races', { auth: false });
}

export function getPublicRaceResults(raceId) {
  return httpRequest(`/api/races/${raceId}/results`, { auth: false });
}

export function createTournamentProgram(payload) {
  // FLOW: Admin Create Tournament Program
  // ORDER: 5/8 - Frontend API service sends POST /api/tournaments/program.
  // API: POST /api/tournaments/program.
  // Purpose: persist the wizard create flow as one backend transaction for Tournament + Conditions + Races + RacePrizes.
  return httpRequest('/api/tournaments/program', {
    method: 'POST',
    body: payload
  });
}

export function updateTournament(tournamentId, payload) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 4A/8 - Frontend API updates Tournament base fields before Race synchronization starts.
  // API: PUT /api/tournaments/{id}.
  // Purpose: update Tournament-level fields and Conditions before Race synchronization.
  return httpRequest(`/api/tournaments/${tournamentId}`, {
    method: 'PUT',
    body: payload
  });
}

export function uploadTournamentVenueImage(tournamentId, file) {
  // FLOW: Admin Tournament Images
  // ORDER: 3V/7 - Frontend API sends venue multipart upload to the Tournament image endpoint.
  // API: POST /api/tournaments/{id}/venue-image.
  // Purpose: upload a Tournament venue image file after Tournament JSON persistence succeeds.
  const formData = new FormData();
  formData.append('file', file);

  return httpRequest(`/api/tournaments/${tournamentId}/venue-image`, {
    method: 'POST',
    body: formData
  });
}

export function removeTournamentVenueImage(tournamentId) {
  // FLOW: Admin Tournament Images
  // ORDER: 3V/7 - Frontend API sends venue image removal to the Tournament image endpoint.
  // API: DELETE /api/tournaments/{id}/venue-image.
  // Purpose: remove the saved Tournament venue image URL/storage object.
  return httpRequest(`/api/tournaments/${tournamentId}/venue-image`, {
    method: 'DELETE'
  });
}

export function closeTournamentRegistration(tournamentId) {
  // FLOW: Admin Tournament Lifecycle
  // ORDER: 3CLOSE/5 - Frontend API calls backend close-registration endpoint.
  // API: PUT /api/tournaments/{id}/close-registration.
  // Purpose: close Tournament registration and close still-open child Races.
  return httpRequest(`/api/tournaments/${tournamentId}/close-registration`, {
    method: 'PUT'
  });
}

export function completeTournament(tournamentId) {
  // FLOW: Admin Tournament Lifecycle
  // ORDER: 3COMPLETE/5 - Frontend API calls backend complete endpoint.
  // API: PUT /api/tournaments/{id}/complete.
  // Purpose: mark Tournament completed after all Races are completed.
  return httpRequest(`/api/tournaments/${tournamentId}/complete`, {
    method: 'PUT'
  });
}

export function cancelTournament(tournamentId) {
  // FLOW: Admin Tournament Lifecycle
  // ORDER: 4CANCEL/5 - Frontend API calls backend cancel endpoint after dialog confirmation.
  // API: DELETE /api/tournaments/{id}.
  // Purpose: cancel an editable Tournament and its child Races.
  return httpRequest(`/api/tournaments/${tournamentId}`, {
    method: 'DELETE'
  });
}

export function getRacesByTournament(tournamentId) {
  return httpRequest(`/api/races/by-tournament/${tournamentId}`);
}

export function createRace(payload) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 4B/8 - Frontend API creates a newly added Race during edit synchronization.
  // API: POST /api/races.
  // Purpose: add a new Race to an existing Tournament during edit synchronization.
  return httpRequest('/api/races', {
    method: 'POST',
    body: payload
  });
}

export function updateRace(raceId, payload) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 4C/8 - Frontend API updates an existing Race during edit synchronization.
  // API: PUT /api/races/{id}.
  // Purpose: update an existing Race's schedule, track, capacity, and prize rules during edit synchronization.
  return httpRequest(`/api/races/${raceId}`, {
    method: 'PUT',
    body: payload
  });
}

export function uploadRaceTrackImage(raceId, file) {
  // FLOW: Admin Tournament Images
  // ORDER: 3R/7 - Frontend API sends track multipart upload to the Race image endpoint.
  // API: POST /api/races/{id}/track-image.
  // Purpose: upload a Race track image file after Race JSON persistence succeeds.
  const formData = new FormData();
  formData.append('file', file);

  return httpRequest(`/api/races/${raceId}/track-image`, {
    method: 'POST',
    body: formData
  });
}

export function removeRaceTrackImage(raceId) {
  // FLOW: Admin Tournament Images
  // ORDER: 3R/7 - Frontend API sends track image removal to the Race image endpoint.
  // API: DELETE /api/races/{id}/track-image.
  // Purpose: remove the saved Race track image URL/storage object.
  return httpRequest(`/api/races/${raceId}/track-image`, {
    method: 'DELETE'
  });
}

export function cancelRace(raceId) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 4D/8 - Frontend API cancels a Race removed from the edit wizard.
  // API: DELETE /api/races/{id}.
  // Purpose: cancel a Race removed from the edit wizard while preserving database history.
  return httpRequest(`/api/races/${raceId}`, {
    method: 'DELETE'
  });
}

export function runRace(raceId) {
  // FLOW: Admin Launch Unity Race
  // ORDER: 3/9 - API service posts Race ID to backend run endpoint; frontend sends no engine token.
  // API: POST /api/races/{raceId}/run.
  // Purpose: backend validates READY/referee/minimum entries, generates token, and starts Unity after DB commit.
  return httpRequest(`/api/races/${raceId}/run`, {
    method: 'POST'
  });
}

export function readyRace(raceId) {
  // FLOW: Admin Mark Race READY
  // ORDER: 3/6 - API service sends Race ID to backend READY transition endpoint.
  // API: PUT /api/races/{raceId}/ready.
  // Purpose: request backend validation for start time and minimum RaceEntry count before Unity launch is allowed.
  return httpRequest(`/api/races/${raceId}/ready`, {
    method: 'PUT'
  });
}

export function fastForwardRaceForDemo(raceId) {
  // FLOW: Admin Demo Time Control
  // API: PUT /api/races/{raceId}/demo-time.
  // Purpose: shift Race/BetEvent timing for presentation testing without manual MySQL edits.
  return httpRequest(`/api/races/${raceId}/demo-time`, {
    method: 'PUT'
  });
}

export function finalizeRaceEntries(raceId) {
  // FLOW: Admin Finalize RaceEntry
  // ORDER: 2/6 - API service sends Race ID to backend RaceEntry finalization endpoint.
  // API: PUT /api/races/{raceId}/finalize-entries.
  // Purpose: backend validates minimum assigned entries and locks the RaceEntry list before READY.
  return httpRequest(`/api/races/${raceId}/finalize-entries`, {
    method: 'PUT'
  });
}

export function failRaceRun(raceId, reason) {
  // FLOW: Admin Fail Running Race
  // ORDER: 4/7 - API wrapper sends only the admin reason; backend owns validation, cancellation, and token cleanup.
  // API: PUT /api/races/{raceId}/run/fail with admin-provided reason.
  // Purpose: backend validates the Race is launched/IN_PROGRESS, clears engine token, and marks it CANCELLED.
  return httpRequest(`/api/races/${raceId}/run/fail`, {
    method: 'PUT',
    body: { reason }
  });
}

export function getRaceResults(raceId) {
  // FLOW: Official Result Display
  // ORDER: 2/7 - Frontend calls the official results endpoint for the selected Race.
  // API: GET /api/races/{raceId}/results returns official RaceResult rows after Admin approval.
  return httpRequest(`/api/races/${raceId}/results`);
}
