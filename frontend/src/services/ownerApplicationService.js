import { MOCK_OWNER_APPLICATIONS_KEY, mockOwnerApplications } from '../data/mockData';
import { getUserId } from '../lib';
import { updateMockUserRole } from './mockAuthStore';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getApplicationsFromStorage() {
  const raw = localStorage.getItem(MOCK_OWNER_APPLICATIONS_KEY);

  if (!raw) {
    localStorage.setItem(MOCK_OWNER_APPLICATIONS_KEY, JSON.stringify(mockOwnerApplications));
    return clone(mockOwnerApplications);
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(mockOwnerApplications);
  } catch {
    localStorage.setItem(MOCK_OWNER_APPLICATIONS_KEY, JSON.stringify(mockOwnerApplications));
    return clone(mockOwnerApplications);
  }
}

function saveApplications(applications) {
  localStorage.setItem(MOCK_OWNER_APPLICATIONS_KEY, JSON.stringify(applications));
}

export async function getMyOwnerApplication(user) {
  await delay(180);
  const userId = getUserId(user);

  if (!userId) return null;

  const application = getApplicationsFromStorage()
    .filter((item) => Number(item.userID) === Number(userId))
    .sort((a, b) => Number(b.applicationID) - Number(a.applicationID))[0];

  return application || null;
}

export async function submitOwnerApplication(user, payload) {
  await delay(450);

  const userId = getUserId(user);
  if (!userId) throw new Error('Không tìm thấy tài khoản hiện tại.');

  const applications = getApplicationsFromStorage();
  const nextId = Math.max(1000, ...applications.map((item) => Number(item.applicationID || 0))) + 1;

  const application = {
    applicationID: nextId,
    userID: Number(userId),
    applicantEmail: user?.email || '',
    applicantPhone: user?.phone || '',
    fullName: String(payload.fullName || '').trim(),
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    nationality: String(payload.nationality || '').trim(),
    address: String(payload.address || '').trim(),
    identityDocumentImage: payload.identityDocumentImage || '',
    identityDocumentFileName: payload.identityDocumentFileName || '',
    status: 'PENDING',
    submittedAt: today()
  };

  applications.push(application);
  saveApplications(applications);
  return application;
}

export async function getAllOwnerApplications() {
  await delay(220);
  return getApplicationsFromStorage().sort((a, b) => Number(b.applicationID) - Number(a.applicationID));
}

export async function getOwnerApplicationById(applicationId) {
  await delay(180);
  const application = getApplicationsFromStorage().find(
    (item) => String(item.applicationID) === String(applicationId)
  );

  if (!application) throw new Error('Không tìm thấy đơn đăng ký owner.');
  return application;
}

export async function approveOwnerApplication(applicationId) {
  await delay(450);
  const applications = getApplicationsFromStorage();
  const index = applications.findIndex((item) => String(item.applicationID) === String(applicationId));

  if (index < 0) throw new Error('Không tìm thấy đơn đăng ký owner.');

  const approvedAt = today();
  applications[index] = {
    ...applications[index],
    status: 'APPROVED',
    approvedAt,
    ownerSince: approvedAt,
    rejectedAt: undefined,
    rejectReason: undefined
  };

  saveApplications(applications);
  updateMockUserRole(applications[index].userID, 'OWNER');
  return applications[index];
}

export async function rejectOwnerApplication(applicationId, rejectReason) {
  await delay(450);
  const reason = String(rejectReason || '').trim();

  if (!reason) throw new Error('Reject reason là bắt buộc.');

  const applications = getApplicationsFromStorage();
  const index = applications.findIndex((item) => String(item.applicationID) === String(applicationId));

  if (index < 0) throw new Error('Không tìm thấy đơn đăng ký owner.');

  applications[index] = {
    ...applications[index],
    status: 'REJECTED',
    rejectedAt: today(),
    rejectReason: reason,
    approvedAt: undefined,
    ownerSince: undefined
  };

  saveApplications(applications);
  updateMockUserRole(applications[index].userID, 'SPECTATOR');
  return applications[index];
}


export async function updateMyOwnerProfile(user, payload) {
  await delay(400);

  const userId = getUserId(user);
  if (!userId) throw new Error('Không tìm thấy tài khoản hiện tại.');

  const applications = getApplicationsFromStorage();
  const approvedApplications = applications
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => Number(item.userID) === Number(userId) && item.status === 'APPROVED')
    .sort((a, b) => Number(b.item.applicationID) - Number(a.item.applicationID));

  if (approvedApplications.length === 0) {
    throw new Error('Không tìm thấy OwnerProfile đã được duyệt.');
  }

  const targetIndex = approvedApplications[0].index;
  const existing = applications[targetIndex];

  applications[targetIndex] = {
  ...existing,
  fullName: String(payload.fullName || '').trim(),
  dateOfBirth: payload.dateOfBirth,
  gender: payload.gender,
  nationality: String(payload.nationality || '').trim(),
  address: String(payload.address || '').trim(),

  // Không cho Owner tự sửa Email, Phone, National ID / Passport image
  identityDocumentImage: existing.identityDocumentImage || '',
  identityDocumentFileName: existing.identityDocumentFileName || '',
  applicantEmail: existing.applicantEmail || user?.email || '',
  applicantPhone: existing.applicantPhone || user?.phone || '',

  updatedAt: today()
};

  saveApplications(applications);
  return applications[targetIndex];
}
