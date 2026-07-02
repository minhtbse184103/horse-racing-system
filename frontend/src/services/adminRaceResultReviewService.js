import { httpRequest } from '../api/httpClient';

const BASE_PATH = '/api/admin/race-result-submissions';

export function getAdminRaceResultReviewQueue() {
  return httpRequest(`${BASE_PATH}/review-queue`);
}

export function getAdminRaceResultSubmissionDetail(submissionId) {
  return httpRequest(`${BASE_PATH}/${submissionId}`);
}

export function approveRaceResultSubmission(submissionId, reason = '') {
  const comment = String(reason || '').trim();

  return httpRequest(`${BASE_PATH}/${submissionId}/approve`, {
    method: 'PUT',
    body: comment ? { reason: comment } : {}
  });
}

export function rejectRaceResultSubmission(submissionId, reason) {
  return httpRequest(`${BASE_PATH}/${submissionId}/reject`, {
    method: 'PUT',
    body: {
      reason: String(reason || '').trim()
    }
  });
}
