import { initialMockState } from '../data/mockData.js';

const STORAGE_KEY = 'horse_racing_mock_state_v1';
const CURRENT_USER_KEY = 'horse_racing_current_user_id_v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function delay(value, ms = 350) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), ms);
  });
}

export function getState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = clone(initialMockState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...clone(initialMockState),
      ...parsed,
      users: parsed.users?.length ? parsed.users : clone(initialMockState.users),
      ownerApplications: parsed.ownerApplications ?? clone(initialMockState.ownerApplications),
      notifications: parsed.notifications ?? clone(initialMockState.notifications),
      horses: parsed.horses ?? [],
      raceRegistrations: parsed.raceRegistrations ?? []
    };
  } catch {
    const seeded = clone(initialMockState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function setState(nextState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new Event('horse-racing-store-updated'));
  return nextState;
}

export function updateState(mutator) {
  const state = getState();
  const result = mutator(state) ?? state;
  return setState(result);
}

export function getCurrentUserId() {
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  return raw ? Number(raw) : null;
}

export function setCurrentUserId(userId) {
  if (!userId) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    window.localStorage.setItem(CURRENT_USER_KEY, String(userId));
  }
  window.dispatchEvent(new Event('horse-racing-auth-updated'));
}

export function nextId(items, key) {
  const max = items.reduce((value, item) => Math.max(value, Number(item[key] ?? 0)), 0);
  return max + 1;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
