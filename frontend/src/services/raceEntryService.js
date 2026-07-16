import { httpRequest } from '../api/httpClient';

export function createRaceEntry({ raceId, registrationId }) {
  // FLOW: Admin Assign RaceEntry
  // ORDER: 3/8 - API service sends only raceId and registrationId; backend owns stall/status/audit fields.
  // API: POST /api/admin/race-entries.
  // Payload contract: frontend sends only raceId and registrationId; backend assigns startingStall, status, assignedAt, and assignedBy.
  return httpRequest('/api/admin/race-entries', {
    method: 'POST',
    body: {
      raceId: Number(raceId),
      registrationId: Number(registrationId)
    }
  });
}

export function getRaceEntriesByRace(raceId) {
  // FLOW: Admin Assigned RaceEntry Load
  // ORDER: 3/6 - API service calls the by-race RaceEntry endpoint for the selected Race.
  // API: GET /api/admin/race-entries/by-race/{raceId}.
  // Purpose: load active official RaceEntry rows for the selected Race, ordered by backend stall query.
  return httpRequest(`/api/admin/race-entries/by-race/${raceId}`);
}

export function getAssignmentQueue() {
  // FLOW: Admin RaceEntry Assignment Queue Load
  // ORDER: 3GLOBAL/7 - API service calls the global assignment queue when no Tournament scope is used.
  // API: GET /api/admin/race-entries/assignment-queue.
  // Purpose: load global assignable Registration candidates when no Tournament scope is used.
  return httpRequest('/api/admin/race-entries/assignment-queue');
}

export function getAssignmentQueueByTournament(tournamentId) {
  // FLOW: Admin RaceEntry Assignment Queue Load
  // ORDER: 3TOURNAMENT/7 - API service calls the Tournament-scoped assignment queue used by the Admin workspace.
  // API: GET /api/admin/race-entries/assignment-queue/by-tournament/{tournamentId}.
  // Purpose: load assignable Registration candidates for the expanded Tournament workspace.
  return httpRequest(`/api/admin/race-entries/assignment-queue/by-tournament/${tournamentId}`);
}

export function cancelRaceEntry(raceEntryId, cancellationReason) {
  // FLOW: Admin Cancel RaceEntry
  // ORDER: 4/6 - API service sends only cancellationReason; backend owns status and audit fields.
  // API: PUT /api/admin/race-entries/{raceEntryId}/cancel.
  // Payload contract: frontend sends only cancellationReason; backend owns CANCELLED status and audit fields.
  return httpRequest(`/api/admin/race-entries/${raceEntryId}/cancel`, {
    method: 'PUT',
    body: { cancellationReason }
  });
}
