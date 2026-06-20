import { APPLICATION_STATUS, ROLES } from '../data/mockData.js';
import { delay, getState, nextId, todayISO, updateState } from './mockStore.js';

export async function getAdminSummary() {
  const state = getState();
  const totalOwners = state.users.filter((user) => user.role === ROLES.OWNER).length;
  const pendingApplications = state.ownerApplications.filter(
    (application) => application.status === APPLICATION_STATUS.PENDING
  ).length;

  return delay({
    totalUsers: state.users.length,
    totalOwners,
    pendingApplications,
    totalHorses: state.horses.length || 128
  });
}

export async function getOwnerApplications() {
  const state = getState();
  const rows = state.ownerApplications.map((application) => {
    const user = state.users.find((item) => item.userID === application.userID);
    return {
      ...application,
      applicantName: application.fullName || user?.username || 'Unknown applicant',
      email: application.email || user?.email,
      phone: application.phone || user?.phone
    };
  });

  return delay(rows.sort((a, b) => Number(b.applicationID) - Number(a.applicationID)));
}

export async function getOwnerApplicationById(applicationID) {
  const applications = await getOwnerApplications();
  return applications.find((application) => String(application.applicationID) === String(applicationID)) ?? null;
}

export async function approveOwnerApplication(applicationID) {
  let updatedApplication = null;

  updateState((draft) => {
    const application = draft.ownerApplications.find(
      (item) => String(item.applicationID) === String(applicationID)
    );
    if (!application) return;

    application.status = APPLICATION_STATUS.APPROVED;
    application.approvedAt = todayISO();
    application.ownerSince = todayISO();
    delete application.rejectedAt;
    delete application.rejectReason;

    const user = draft.users.find((item) => item.userID === application.userID);
    if (user) {
      user.role = ROLES.OWNER;
    }

    draft.notifications.push({
      id: nextId(draft.notifications, 'id'),
      userID: application.userID,
      title: 'Owner application approved',
      message: 'Your Owner application has been approved.',
      createdAt: todayISO(),
      read: false,
      type: 'approved'
    });

    updatedApplication = application;
  });

  return delay(updatedApplication);
}

export async function rejectOwnerApplication(applicationID, rejectReason) {
  if (!rejectReason?.trim()) {
    throw new Error('Reject reason is required.');
  }

  let updatedApplication = null;

  updateState((draft) => {
    const application = draft.ownerApplications.find(
      (item) => String(item.applicationID) === String(applicationID)
    );
    if (!application) return;

    application.status = APPLICATION_STATUS.REJECTED;
    application.rejectedAt = todayISO();
    application.rejectReason = rejectReason.trim();
    delete application.approvedAt;
    delete application.ownerSince;

    const user = draft.users.find((item) => item.userID === application.userID);
    if (user) {
      user.role = ROLES.SPECTATOR;
    }

    draft.notifications.push({
      id: nextId(draft.notifications, 'id'),
      userID: application.userID,
      title: 'Owner application rejected',
      message: `Your Owner application has been rejected. Reason: ${rejectReason.trim()}`,
      createdAt: todayISO(),
      read: false,
      type: 'rejected'
    });

    updatedApplication = application;
  });

  return delay(updatedApplication);
}

export async function getUsers() {
  const state = getState();
  return delay(state.users.map(({ password, ...user }) => user));
}
