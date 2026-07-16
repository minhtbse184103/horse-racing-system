import { httpRequest } from '../api/httpClient';

export function getRefereeAssignments() {
  // FLOW: Admin Referee Assignment Page Data Load
  // ORDER: 2A/7 - API service reads current Race -> Referee assignment rows for the table.
  // API: GET /api/admin/referee-assignments.
  // Purpose: load current Race -> Referee assignments for the Admin assignment table.
  return httpRequest('/api/admin/referee-assignments');
}

export function getActiveReferees() {
  // FLOW: Admin Referee Assignment Page Data Load
  // ORDER: 2B/7 - API service reads ACTIVE REFEREE users for assign/replace dialogs.
  // API: GET /api/admin/referee-assignments/referees.
  // Purpose: load ACTIVE REFEREE users available for create/replace assignment dialogs.
  return httpRequest('/api/admin/referee-assignments/referees');
}

export function createRefereeAssignment(payload) {
  // FLOW: Admin Create Referee Assignment
  // ORDER: 3/6 - API service posts raceId + refereeUserId to the admin Referee assignment endpoint.
  // API: POST /api/admin/referee-assignments.
  // Payload contract: raceId + refereeUserId; backend creates the assignment and owns validation/audit timing.
  return httpRequest('/api/admin/referee-assignments', {
    method: 'POST',
    body: payload
  });
}

export function replaceRefereeAssignment(raceId, refereeUserId) {
  // FLOW: Admin Replace Referee
  // ORDER: 3/6 - API service sends Race ID and replacement Referee ID in the URL.
  // API: PUT /api/admin/referee-assignments/{raceId}/referee/{refereeUserId}.
  // Purpose: switch the assigned Referee for a Race after backend schedule conflict validation.
  return httpRequest(
    `/api/admin/referee-assignments/${raceId}/referee/${refereeUserId}`,
    { method: 'PUT' }
  );
}

export function removeRefereeAssignment(raceId) {
  // FLOW: Admin Remove Referee Assignment
  // ORDER: 4/6 - API service sends the Race ID to delete its current Referee assignment.
  // API: DELETE /api/admin/referee-assignments/{raceId}.
  // Purpose: remove the current Referee assignment so another Referee can be assigned later.
  return httpRequest(`/api/admin/referee-assignments/${raceId}`, {
    method: 'DELETE'
  });
}

export function getAssignableRaces() {
  // FLOW: Admin Referee Assignment Page Data Load
  // ORDER: 2C/7 - API service reads Race options that can still receive a Referee.
  // API: GET /api/admin/referee-assignments/assignable-races.
  // Purpose: load Races in assignable statuses; UI removes races that already have an assignment.
  return httpRequest('/api/admin/referee-assignments/assignable-races');
}
