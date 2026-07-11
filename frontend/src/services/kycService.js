import { httpRequest } from '../api/httpClient';

function unwrapApiResponse(response) {
  return response && typeof response === 'object' && 'data' in response
    ? response.data
    : response;
}

function toKycFormData(payload) {
  const formData = new FormData();
  formData.append('fullName', String(payload.fullName || '').trim());
  formData.append('dateOfBirth', payload.dateOfBirth || '');
  formData.append('identityNumber', String(payload.identityNumber || '').trim());
  if (payload.identityFrontFile) formData.append('identityFrontFile', payload.identityFrontFile);
  if (payload.identityBackFile) formData.append('identityBackFile', payload.identityBackFile);
  if (payload.selfieFile) formData.append('selfieFile', payload.selfieFile);
  return formData;
}

export function needsKycSubmission(kyc) {
  const status = String(kyc?.status || 'NOT_SUBMITTED').toUpperCase();
  return status === 'NOT_SUBMITTED' || status === 'REJECTED' || status === 'EXPIRED';
}

export function canUseExistingKyc(kyc) {
  const status = String(kyc?.status || '').toUpperCase();
  return status === 'PENDING' || status === 'VERIFIED';
}

export async function getMyKyc() {
  const response = await httpRequest('/api/kyc/me', {
    fallbackError: 'Khong the tai trang thai KYC.'
  });
  return unwrapApiResponse(response);
}

export async function submitKyc(payload) {
  const response = await httpRequest('/api/kyc/me', {
    method: 'POST',
    body: toKycFormData(payload),
    fallbackError: 'Khong the gui ho so KYC.'
  });
  return unwrapApiResponse(response);
}
