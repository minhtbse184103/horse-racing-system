import { httpRequest } from '../api/httpClient';

function unwrapApiResponse(response) {
  return response && typeof response === 'object' && 'data' in response
    ? response.data
    : response;
}

export async function getMyJockeyVerification() {
  const response = await httpRequest('/api/jockeys/verifications/my', {
    fallbackError: 'Khong the tai trang thai dang ky jockey.'
  });

  return unwrapApiResponse(response);
}

export async function submitJockeyVerification(payload) {
  const response = await httpRequest('/api/jockeys/verifications/submit', {
    method: 'POST',
    body: payload,
    fallbackError: 'Khong the gui don dang ky jockey.'
  });

  return unwrapApiResponse(response);
}

export async function resubmitJockeyVerification(verificationId, payload) {
  const response = await httpRequest(`/api/jockeys/verifications/${verificationId}/resubmit`, {
    method: 'PUT',
    body: payload,
    fallbackError: 'Khong the gui lai don dang ky jockey.'
  });

  return unwrapApiResponse(response);
}
