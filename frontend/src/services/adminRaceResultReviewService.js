import { httpRequest } from '../api/httpClient';

const BASE_PATH = '/api/admin/race-result-submissions';

export function getAdminRaceResultReviewQueue() {
  // FLOW: Admin Result Review Queue
  // ORDER: 2/6 - FE service calls the admin review queue endpoint.
  // API: GET /api/admin/race-result-submissions/review-queue.
  // Backend returns only REFEREE_CONFIRMED / REFEREE_FLAGGED provisional submissions.
  return httpRequest(`${BASE_PATH}/review-queue`);
}

export function getAdminRaceResultSubmissionDetail(submissionId) {
  // FLOW: Admin Result Review Detail
  // ORDER: 2/8 - FE service requests one provisional submission detail by ID.
  // API: GET /api/admin/race-result-submissions/{submissionId}.
  // Backend returns provisional entries, Referee decision, and review history.
  return httpRequest(`${BASE_PATH}/${submissionId}`);
}

export function approveRaceResultSubmission(submissionId, reason = '') {
  // FLOW: Admin Approve Result
  // ORDER: 2/9 - FE service sends approval request with optional admin comment.
  // API: PUT /api/admin/race-result-submissions/{submissionId}/approve.
  // Backend converts provisional submission into official RaceResult, PrizeDistribution, and COMPLETED Race.
  const comment = String(reason || '').trim();

  return httpRequest(`${BASE_PATH}/${submissionId}/approve`, {
    method: 'PUT',
    body: comment ? { reason: comment } : {}
  });
}

export function rejectRaceResultSubmission(submissionId, reason) {
  // FLOW: Admin Reject Result
  // ORDER: 3/8 - FE service sends required rejection reason to backend.
  // API: PUT /api/admin/race-result-submissions/{submissionId}/reject.
  // Sends required reason; backend preserves rejected submission history and resets Race to READY.
  return httpRequest(`${BASE_PATH}/${submissionId}/reject`, {
    method: 'PUT',
    body: {
      reason: String(reason || '').trim()
    }
  });
}
