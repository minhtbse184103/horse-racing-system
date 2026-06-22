import { httpRequest } from '../api/httpClient';

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
    rejectReason: application.rejectReason ?? application.feedback
  };
}

function normalizeOwnerProfile(profile) {
  if (!profile) return null;

  return {
    ...profile,
    approvedAt: profile.approvedAt ?? profile.reviewedAt,
    ownerSince: profile.ownerSince ?? profile.approvedAt ?? profile.reviewedAt,
    status: profile.status ?? 'APPROVED'
  };
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
  const application = await httpRequest('/api/owner-applications/me', {
    method: 'POST',
    body: {
      fullName: String(payload.fullName || '').trim(),
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      nationality: String(payload.nationality || '').trim(),
      address: String(payload.address || '').trim(),
      identityDocumentImage: payload.identityDocumentImage,
      identityDocumentFileName: payload.identityDocumentFileName
    },
    fallbackError: 'Khong the gui don dang ky owner.'
  });

  return normalizeOwnerApplication(application);
}

export async function getAllOwnerApplications(status = 'PENDING') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const applications = await httpRequest(`/api/admin/owner-applications${query}`, {
    fallbackError: 'Khong the tai danh sach don dang ky owner.'
  });

  return Array.isArray(applications)
    ? applications.map(normalizeOwnerApplication)
    : [];
}

export async function getOwnerApplicationById(applicationId) {
  const applications = await getAllOwnerApplications('');
  const application = applications.find(
    (item) => String(item.applicationID) === String(applicationId)
  );

  if (!application) throw new Error('Khong tim thay don dang ky owner.');
  return application;
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
    body: { feedback: reason },
    fallbackError: 'Khong the tu choi don dang ky owner.'
  });

  return normalizeOwnerApplication(application);
}
