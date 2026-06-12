import { httpRequest } from '../api/httpClient';

export function getRefereeAssignments() {
  return httpRequest('/api/admin/referee-assignments');
}

export function getActiveReferees() {
  return httpRequest('/api/admin/referee-assignments/referees');
}

export function createRefereeAssignment(payload) {
  return httpRequest('/api/admin/referee-assignments', {
    method: 'POST',
    body: payload
  });
}

export function replaceRefereeAssignment(raceId, refereeUserId) {
  return httpRequest(
    `/api/admin/referee-assignments/${raceId}/referee/${refereeUserId}`,
    { method: 'PUT' }
  );
}

export function removeRefereeAssignment(raceId) {
  return httpRequest(`/api/admin/referee-assignments/${raceId}`, {
    method: 'DELETE'
  });
}