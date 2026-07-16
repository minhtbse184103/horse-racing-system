import { httpRequest } from '../api/httpClient';

function unwrap(response) {
  return response && typeof response === 'object' && 'data' in response ? response.data : response;
}

export function needsKycSubmission(kyc) {
  return ['NOT_SUBMITTED', 'REJECTED', 'EXPIRED', 'ABANDONED'].includes(
    String(kyc?.status || 'NOT_SUBMITTED').toUpperCase()
  );
}

export async function getMyKyc() {
  return unwrap(await httpRequest('/api/kyc/me', {
    fallbackError: 'Khong the tai trang thai KYC.'
  }));
}

export async function createKycSession() {
  return unwrap(await httpRequest('/api/kyc/session', {
    method: 'POST',
    fallbackError: 'Khong the tao phien xac minh Didit.'
  }));
}
