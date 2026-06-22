import { httpRequest } from '../api/httpClient';

function unwrapApiResponse(response) {
  return response && typeof response === 'object' && 'data' in response
    ? response.data
    : response;
}

function normalizeJockeyVerification(verification) {
  if (!verification) return verification;

  const firstFile = Array.isArray(verification.files) ? verification.files[0] : null;
  const imageUrls = Array.isArray(verification.files)
    ? verification.files.map((file) => file.fileUrl).filter(Boolean)
    : [];

  return {
    ...verification,
    fullName: verification.jockeyFullName || `Jockey ${verification.jockeyId}`,
    email: verification.jockeyEmail || '',
    licenseNo: verification.licenceType || verification.verificationLink || `Verification ${verification.verificationId}`,
    imgUrl: firstFile?.fileUrl || verification.verificationLink || '',
    imageUrls,
    status: verification.verificationStatus,
    reviewId: verification.verificationId
  };
}

export async function getJockeyProfilesUnderReview() {
  const [pendingResponse, approvedResponse] = await Promise.all([
    httpRequest('/api/admin/jockeys/verifications/pending', {
      fallbackError: 'Khong the tai ho so jockey dang cho duyet.'
    }),
    httpRequest('/api/admin/jockeys/verifications/approved', {
      fallbackError: 'Khong the tai ho so jockey da duyet.'
    })
  ]);

  const pendingData = unwrapApiResponse(pendingResponse);
  const approvedData = unwrapApiResponse(approvedResponse);
  return [
    ...(Array.isArray(pendingData) ? pendingData : []),
    ...(Array.isArray(approvedData) ? approvedData : [])
  ].map(normalizeJockeyVerification);
}

export async function getJockeyProfilesPendingOnly() {
  const response = await httpRequest('/api/admin/jockeys/verifications/pending', {
    fallbackError: 'Khong the tai ho so jockey dang cho duyet.'
  });

  const data = unwrapApiResponse(response);
  return Array.isArray(data) ? data.map(normalizeJockeyVerification) : [];
}

export function approveJockeyProfile(verificationId) {
  return httpRequest(`/api/admin/jockeys/verifications/${verificationId}/review`, {
    method: 'PUT',
    body: { status: 'APPROVED' },
    fallbackError: 'Khong the phe duyet ho so jockey.'
  });
}

export function rejectJockeyProfile(verificationId, feedback) {
  return httpRequest(`/api/admin/jockeys/verifications/${verificationId}/review`, {
    method: 'PUT',
    body: { status: 'REJECTED', rejectionReason: feedback },
    fallbackError: 'Khong the tu choi ho so jockey.'
  });
}
