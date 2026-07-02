import { httpRequest } from '../api/httpClient';

const BASE_PATH = '/api/referee/race-result-submissions';

export function getPendingRaceResultSubmissions() {
  return httpRequest(`${BASE_PATH}/pending`);
}

export function getRaceResultSubmissionDetail(submissionId) {
  return httpRequest(`${BASE_PATH}/${submissionId}`);
}

export function confirmRaceResultSubmission(submissionId, reason = '') {
  const comment = String(reason || '').trim();

  return httpRequest(`${BASE_PATH}/${submissionId}/confirm`, {
    method: 'PUT',
    body: comment ? { reason: comment } : {}
  });
}

export function flagRaceResultSubmission(submissionId, reason) {
  return httpRequest(`${BASE_PATH}/${submissionId}/flag`, {
    method: 'PUT',
    body: {
      reason: String(reason || '').trim()
    }
  });
}
