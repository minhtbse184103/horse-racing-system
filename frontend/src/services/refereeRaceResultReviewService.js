import { httpRequest } from '../api/httpClient';

const BASE_PATH = '/api/referee/race-result-submissions';

export function getPendingRaceResultSubmissions() {
  // FLOW: Referee Review Queue
  // ORDER: 3/7 - FE service calls the referee-only pending submissions endpoint.
  // API: GET /api/referee/race-result-submissions/pending.
  // Backend filters by authenticated ACTIVE REFEREE and assigned Race.
  return httpRequest(`${BASE_PATH}/pending`);
}

export function getRaceResultSubmissionDetail(submissionId) {
  // FLOW: Referee Review Detail
  // ORDER: 2/8 - FE service requests one provisional submission detail by id.
  // API: GET /api/referee/race-result-submissions/{submissionId}.
  // Backend returns entries and review history only if the Referee is assigned to the Race.
  return httpRequest(`${BASE_PATH}/${submissionId}`);
}

export function confirmRaceResultSubmission(submissionId, reason = '') {
  // FLOW: Referee Confirm Result
  // ORDER: 2/6 - FE service sends confirm request with optional trimmed reason/comment only.
  // API: PUT /api/referee/race-result-submissions/{submissionId}/confirm.
  // Sends only optional reason/comment; backend owns status transition and audit history.
  const comment = String(reason || '').trim();

  return httpRequest(`${BASE_PATH}/${submissionId}/confirm`, {
    method: 'PUT',
    body: comment ? { reason: comment } : {}
  });
}

export function flagRaceResultSubmission(submissionId, reason) {
  // FLOW: Referee Flag Result
  // ORDER: 3/6 - FE service sends flag request with required trimmed reason.
  // API: PUT /api/referee/race-result-submissions/{submissionId}/flag.
  // Sends required reason; backend owns REFEREE_FLAGGED status and audit history.
  return httpRequest(`${BASE_PATH}/${submissionId}/flag`, {
    method: 'PUT',
    body: {
      reason: String(reason || '').trim()
    }
  });
}
