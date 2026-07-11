import { httpRequest } from '../api/httpClient';
import API_BASE_URL from '../configs/apiConfig';

function unwrapApiResponse(response) {
  return response && typeof response === 'object' && 'data' in response
    ? response.data
    : response;
}

function toAbsoluteFileUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

export function normalizeKycRecord(record) {
  if (!record) return null;

  return {
    ...record,
    status: record.status || 'NOT_SUBMITTED',
    identityFrontUrl: toAbsoluteFileUrl(record.identityFrontUrl),
    identityBackUrl: toAbsoluteFileUrl(record.identityBackUrl),
    selfieUrl: toAbsoluteFileUrl(record.selfieUrl)
  };
}

export async function getAdminKycRecords(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await httpRequest(`/api/admin/kyc${query}`, {
    fallbackError: 'Khong the tai danh sach KYC.'
  });
  const data = unwrapApiResponse(response);
  return Array.isArray(data) ? data.map(normalizeKycRecord) : [];
}

export async function approveAdminKyc(verificationId) {
  const response = await httpRequest(`/api/admin/kyc/${verificationId}/approve`, {
    method: 'PUT',
    fallbackError: 'Khong the duyet ho so KYC.'
  });
  return normalizeKycRecord(unwrapApiResponse(response));
}

export async function rejectAdminKyc(verificationId, feedback) {
  const response = await httpRequest(`/api/admin/kyc/${verificationId}/reject`, {
    method: 'PUT',
    body: { feedback },
    fallbackError: 'Khong the tu choi ho so KYC.'
  });
  return normalizeKycRecord(unwrapApiResponse(response));
}

export async function getAdminKycByUserIds(userIds) {
  const idSet = new Set(
    (Array.isArray(userIds) ? userIds : [])
      .map((id) => Number(id))
      .filter(Number.isFinite)
  );
  if (idSet.size === 0) return new Map();

  const records = await getAdminKycRecords();
  return records.reduce((map, record) => {
    if (idSet.has(Number(record.userId))) {
      map.set(Number(record.userId), record);
    }
    return map;
  }, new Map());
}
