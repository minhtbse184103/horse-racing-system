import { httpRequest } from '../api/httpClient';
import { mockOwnerHorses } from '../data/mockData';

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

function getMockHorseId(horse) {
  return horse?.horseId ?? horse?.horseID ?? horse?.id;
}

export async function getPendingHorses() {
  if (USE_MOCK_OWNER) {
    await delay();
    return getMockHorses().filter((horse) => String(horse.status || '').toUpperCase() === 'PENDING');
  }

  return httpRequest('/api/admin/horses/pending', {
    fallbackError: 'Không thể tải hồ sơ ngựa đang chờ duyệt.'
  });
}

export async function approveHorse(horseId) {
  if (USE_MOCK_OWNER) {
    await delay(320);
    const horses = getMockHorses();
    const index = horses.findIndex((horse) => String(getMockHorseId(horse)) === String(horseId));

    if (index < 0) throw new Error('Không tìm thấy hồ sơ ngựa trong mock data.');

    horses[index] = {
      ...horses[index],
      status: 'ACTIVE',
      approvedAt: new Date().toISOString().slice(0, 10),
      rejectionReason: ''
    };
    saveMockHorses(horses);
    return horses[index];
  }

  return httpRequest(`/api/admin/horses/${horseId}/approve`, {
    method: 'PUT',
    fallbackError: 'Không thể phê duyệt hồ sơ ngựa.'
  });
}

export async function rejectHorse(horseId, feedback) {
  if (USE_MOCK_OWNER) {
    await delay(320);
    const horses = getMockHorses();
    const index = horses.findIndex((horse) => String(getMockHorseId(horse)) === String(horseId));

    if (index < 0) throw new Error('Không tìm thấy hồ sơ ngựa trong mock data.');

    horses[index] = {
      ...horses[index],
      status: 'REJECTED',
      rejectedAt: new Date().toISOString().slice(0, 10),
      rejectionReason: feedback
    };
    saveMockHorses(horses);
    return horses[index];
  }

  return httpRequest(`/api/admin/horses/${horseId}/reject`, {
    method: 'PUT',
    body: { feedback },
    fallbackError: 'Không thể từ chối hồ sơ ngựa.'
  });
}
