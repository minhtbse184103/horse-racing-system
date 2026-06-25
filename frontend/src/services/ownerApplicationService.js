import { httpRequest } from '../api/httpClient';
import API_BASE_URL from '../configs/apiConfig';

function toAbsoluteFileUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

function normalizeOwnerApplication(application) {
  if (!application) return null;

  return {
    ...application,
    applicationID: application.applicationID ?? application.applicationId ?? application.id,
    applicationId: application.applicationId ?? application.applicationID ?? application.id,
    userID: application.userID ?? application.userId,
    applicantEmail: application.applicantEmail ?? application.email,
    applicantPhone: application.applicantPhone ?? application.phone,
    approvedAt: application.approvedAt ?? application.reviewedAt,
    rejectedAt: application.rejectedAt ?? application.reviewedAt,
    ownerSince: application.ownerSince ?? application.approvedAt ?? application.reviewedAt,
    rejectReason: application.rejectReason ?? application.feedback,
    identityDocumentUrl: toAbsoluteFileUrl(application.identityDocumentUrl),
    stableCertificateUrl: toAbsoluteFileUrl(application.stableCertificateUrl),
    horseOwnershipProofUrl: toAbsoluteFileUrl(application.horseOwnershipProofUrl)
  };
}

function normalizeOwnerProfile(profile) {
  if (!profile) return null;

  return {
    ...profile,
    approvedAt: profile.approvedAt ?? profile.reviewedAt,
    ownerSince: profile.ownerSince ?? profile.approvedAt ?? profile.reviewedAt,
    status: profile.status ?? 'APPROVED',
    identityDocumentUrl: toAbsoluteFileUrl(profile.identityDocumentUrl),
    stableCertificateUrl: toAbsoluteFileUrl(profile.stableCertificateUrl),
    horseOwnershipProofUrl: toAbsoluteFileUrl(profile.horseOwnershipProofUrl)
  };
}

function toOwnerApplicationFormData(payload) {
  const formData = new FormData();
  formData.append('fullName', String(payload.fullName || '').trim());
  formData.append('dateOfBirth', payload.dateOfBirth || '');
  formData.append('gender', String(payload.gender || '').trim());
  formData.append('nationality', String(payload.nationality || '').trim());
  formData.append('address', String(payload.address || '').trim());
  formData.append('stableName', String(payload.stableName || '').trim());
  formData.append('stableAddress', String(payload.stableAddress || '').trim());
  formData.append('totalHorsesOwned', String(payload.totalHorsesOwned || ''));

  if (payload.identityDocumentFile) formData.append('identityDocumentFile', payload.identityDocumentFile);
  if (payload.stableCertificateFile) formData.append('stableCertificateFile', payload.stableCertificateFile);
  if (payload.horseOwnershipProofFile) formData.append('horseOwnershipProofFile', payload.horseOwnershipProofFile);

  return formData;
}

export async function getMyOwnerApplication() {
  const application = await httpRequest('/api/owner-applications/me', {
    fallbackError: 'Khong the tai don dang ky owner.'
  });
  return normalizeOwnerApplication(application);
}

export async function getMyOwnerProfile() {
  const profile = await httpRequest('/api/owner/profile', {
    fallbackError: 'Khong the tai OwnerProfile.'
  });
  return normalizeOwnerProfile(profile);
}

export async function submitOwnerApplication(_user, payload) {
  const application = await httpRequest('/api/owner-applications', {
    method: 'POST',
    body: toOwnerApplicationFormData(payload),
    fallbackError: 'Khong the gui don dang ky owner.'
  });

  return normalizeOwnerApplication(application);
}

export async function getAllOwnerApplications(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const applications = await httpRequest(`/api/admin/owner-applications${query}`, {
    fallbackError: 'Khong the tai danh sach don dang ky owner.'
  });

  return Array.isArray(applications)
    ? applications.map(normalizeOwnerApplication)
    : [];
}

export async function getOwnerApplicationById(applicationId) {
  const application = await httpRequest(`/api/admin/owner-applications/${applicationId}`, {
    fallbackError: 'Khong the tai chi tiet don dang ky owner.'
  });
  return normalizeOwnerApplication(application);
}

export async function approveOwnerApplication(applicationId) {
  const application = await httpRequest(`/api/admin/owner-applications/${applicationId}/approve`, {
    method: 'PUT',
    fallbackError: 'Khong the phe duyet don dang ky owner.'
  });

  return normalizeOwnerApplication(application);
}

export async function rejectOwnerApplication(applicationId, rejectReason) {
  const reason = String(rejectReason || '').trim();

  if (!reason) throw new Error('Reject reason la bat buoc.');

  const application = await httpRequest(`/api/admin/owner-applications/${applicationId}/reject`, {
    method: 'PUT',
    body: { rejectReason: reason },
    fallbackError: 'Khong the tu choi don dang ky owner.'
  });

  return normalizeOwnerApplication(application);
}
