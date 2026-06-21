import { httpRequest } from '../api/httpClient';
import {
  approveOwnerApplication as approveOwnerApplicationApi,
  getAllOwnerApplications,
  rejectOwnerApplication as rejectOwnerApplicationApi
} from './ownerApplicationService.js';
import { getPendingHorses } from './adminHorseReviewService.js';

function normalizeApplication(application) {
  if (!application) return null;

  return {
    ...application,
    applicationID: application.applicationID ?? application.applicationId ?? application.id,
    userID: application.userID ?? application.userId,
    applicantName: application.fullName || application.username || 'Unknown applicant',
    approvedAt: application.approvedAt ?? application.reviewedAt,
    rejectedAt: application.rejectedAt ?? application.reviewedAt,
    rejectReason: application.rejectReason ?? application.feedback
  };
}

export async function getAdminSummary() {
  const [users, pendingApplications, pendingHorses] = await Promise.all([
    getUsers(),
    getAllOwnerApplications('PENDING'),
    getPendingHorses()
  ]);

  return {
    totalUsers: users.length,
    totalOwners: users.filter((user) => String(user.role || '').toUpperCase() === 'OWNER').length,
    pendingApplications: pendingApplications.length,
    totalHorses: pendingHorses.length
  };
}

export async function getOwnerApplications(status = 'PENDING') {
  const applications = await getAllOwnerApplications(status);
  return applications.map(normalizeApplication);
}

export async function getOwnerApplicationById(applicationID) {
  const application = await httpRequest(`/api/admin/owner-applications/${applicationID}`, {
    fallbackError: 'Khong the tai chi tiet don dang ky owner.'
  });

  return normalizeApplication(application);
}

export async function approveOwnerApplication(applicationID) {
  return normalizeApplication(await approveOwnerApplicationApi(applicationID));
}

export async function rejectOwnerApplication(applicationID, rejectReason) {
  return normalizeApplication(await rejectOwnerApplicationApi(applicationID, rejectReason));
}

export async function getUsers() {
  return httpRequest('/api/user/all', {
    fallbackError: 'Khong the tai danh sach nguoi dung.'
  });
}
