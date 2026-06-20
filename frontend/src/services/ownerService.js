import { httpRequest } from '../api/httpClient';
import { mockOwnerDashboard, mockOwnerHorses } from '../data/mockData';

const USE_MOCK_OWNER = import.meta.env.VITE_USE_MOCK_OWNER !== 'false';
const MOCK_HORSES_KEY = 'horse-racing:mock-owner-horses';

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMockHorses() {
  const raw = localStorage.getItem(MOCK_HORSES_KEY);

  if (!raw) {
    localStorage.setItem(MOCK_HORSES_KEY, JSON.stringify(mockOwnerHorses));
    return [...mockOwnerHorses];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMockHorses(horses) {
  localStorage.setItem(MOCK_HORSES_KEY, JSON.stringify(horses));
}


function normalizePassportNumber(value) {
  return String(value || '').trim().toUpperCase();
}

export async function checkHorsePassportNumber(passportNumber, currentHorseId = null) {
  const normalizedPassport = normalizePassportNumber(passportNumber);

  if (!normalizedPassport) {
    throw new Error('Passport Number là bắt buộc.');
  }

  if (USE_MOCK_OWNER) {
    await delay(260);
    const horses = getMockHorses();
    const existingHorse = horses.find((horse) => {
      const samePassport = normalizePassportNumber(horse.passportNumber) === normalizedPassport;
      const sameHorse = currentHorseId && String(horse.horseId || horse.id) === String(currentHorseId);
      return samePassport && !sameHorse;
    });

    if (existingHorse) {
      throw new Error('Horse already exists. Passport Number này đã tồn tại trong hệ thống.');
    }

    return { exists: false, passportNumber: normalizedPassport };
  }

  return httpRequest(`/api/owner/horses/check-passport?passportNumber=${encodeURIComponent(normalizedPassport)}`, {
    fallbackError: 'Không thể kiểm tra Passport Number.'
  });
}

export async function getOwnerDashboard() {
  if (USE_MOCK_OWNER) {
    await delay();
    const horses = getMockHorses();
    const registeredHorses = horses.filter((horse) => Number(horse.registrationCount || 0) > 0).length;
    const participatedHorses = horses.filter((horse) => horse.participated).length;

    return {
      ...mockOwnerDashboard,
      totalHorses: horses.length,
      totalRegistrations: horses.reduce((total, horse) => total + Number(horse.registrationCount || 0), 0),
      registeredHorses,
      participatedHorses
    };
  }

  return httpRequest('/api/owner/dashboard', {
    fallbackError: 'Không thể tải bảng điều khiển owner.'
  });
}

export async function getOwnerHorses() {
  if (USE_MOCK_OWNER) {
    await delay();
    return getMockHorses();
  }

  return httpRequest('/api/owner/horses', {
    fallbackError: 'Không thể tải danh sách ngựa.'
  });
}

export async function getOwnerHorseById(horseId) {
  if (USE_MOCK_OWNER) {
    await delay();
    const horse = getMockHorses().find((item) => String(item.horseId || item.id) === String(horseId));
    if (!horse) throw new Error('Không tìm thấy chi tiết ngựa trong mock data.');
    return horse;
  }

  return httpRequest(`/api/owner/horses/${horseId}`, {
    fallbackError: 'Không thể tải chi tiết ngựa.'
  });
}

export async function createHorse(payload) {
  if (USE_MOCK_OWNER) {
    await delay(350);
    const horses = getMockHorses();
    const normalizedPassport = normalizePassportNumber(payload.passportNumber);

    if (!normalizedPassport) {
      throw new Error('Passport Number là bắt buộc.');
    }

    const duplicate = horses.some((horse) => normalizePassportNumber(horse.passportNumber) === normalizedPassport);
    if (duplicate) {
      throw new Error('Horse already exists. Passport Number này đã tồn tại trong hệ thống.');
    }

    const nextId = Math.max(0, ...horses.map((horse) => Number(horse.horseId || horse.id || 0))) + 1;
    const horse = {
      ...payload,
      passportNumber: normalizedPassport,
      horseId: nextId,
      id: nextId,
      status: 'PENDING',
      createdAt: new Date().toISOString().slice(0, 10),
      submittedAt: new Date().toISOString().slice(0, 10),
      registrationCount: 0,
      participated: false
    };
    horses.push(horse);
    saveMockHorses(horses);
    return horse;
  }

  return httpRequest('/api/owner/horses', {
    method: 'POST',
    body: payload,
    fallbackError: 'Không thể thêm ngựa.'
  });
}

export async function updateHorse(horseId, payload) {
  if (USE_MOCK_OWNER) {
    await delay(350);
    const horses = getMockHorses();
    const index = horses.findIndex((horse) => String(horse.horseId || horse.id) === String(horseId));
    if (index < 0) throw new Error('Không tìm thấy hồ sơ ngựa trong mock data.');

    const normalizedPassport = normalizePassportNumber(payload.passportNumber || horses[index].passportNumber);
    const duplicate = horses.some((horse) => {
      const sameHorse = String(horse.horseId || horse.id) === String(horseId);
      return !sameHorse && normalizePassportNumber(horse.passportNumber) === normalizedPassport;
    });

    if (duplicate) {
      throw new Error('Horse already exists. Passport Number này đã tồn tại trong hệ thống.');
    }

    horses[index] = {
      ...horses[index],
      ...payload,
      passportNumber: normalizedPassport,
      status: 'PENDING',
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    saveMockHorses(horses);
    return horses[index];
  }

  return httpRequest(`/api/owner/horses/${horseId}`, {
    method: 'PUT',
    body: payload,
    fallbackError: 'Không thể cập nhật ngựa.'
  });
}

export async function deleteHorse(horseId) {
  if (USE_MOCK_OWNER) {
    await delay(300);
    const horses = getMockHorses();
    saveMockHorses(horses.filter((horse) => String(horse.horseId || horse.id) !== String(horseId)));
    return true;
  }

  return httpRequest(`/api/owner/horses/${horseId}`, {
    method: 'DELETE',
    fallbackError: 'Không thể xóa ngựa.'
  });
}

export function getTournaments() {
  return httpRequest('/api/tournaments', {
    fallbackError: 'Không thể tải danh sách giải đấu.'
  });
}

export function getOwnerInvitations() {
  if (USE_MOCK_OWNER) {
    return Promise.resolve([]);
  }

  return httpRequest('/api/owner/invitations', {
    fallbackError: 'Không thể tải lời mời jockey.'
  });
}

export function inviteJockey(payload) {
  if (USE_MOCK_OWNER) {
    return Promise.resolve({ ...payload, invitationId: Date.now(), status: 'PENDING' });
  }

  return httpRequest('/api/owner/invitations', {
    method: 'POST',
    body: payload,
    fallbackError: 'Không thể gửi lời mời jockey.'
  });
}

export function cancelOwnerInvitation(invitationId) {
  if (USE_MOCK_OWNER) {
    return Promise.resolve({ invitationId, status: 'CANCELLED' });
  }

  return httpRequest(`/api/owner/invitations/${invitationId}/cancel`, {
    method: 'PUT',
    fallbackError: 'Không thể hủy lời mời jockey.'
  });
}
