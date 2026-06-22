import { MOCK_USERS_KEY, mockUsers } from '../data/mockData';
import { getUserId } from '../lib';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getMockUsers() {
  const raw = localStorage.getItem(MOCK_USERS_KEY);

  if (!raw) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
    return clone(mockUsers);
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(mockUsers);
  } catch {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
    return clone(mockUsers);
  }
}

export function saveMockUsers(users) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

export function createMockUser(payload) {
  const users = getMockUsers();
  const email = String(payload.email || '').trim().toLowerCase();

  if (users.some((user) => String(user.email || '').toLowerCase() === email)) {
    throw new Error('Email đã tồn tại trong mock data.');
  }

  const nextId = Math.max(0, ...users.map((user) => Number(getUserId(user) || 0))) + 1;
  const fullName = String(payload.fullName || payload.username || '').trim();

  const user = {
    userID: nextId,
    id: nextId,
    username: payload.username || fullName || email.split('@')[0],
    fullName,
    email,
    phone: String(payload.phone || '').trim(),
    password: payload.password,
    role: 'SPECTATOR',
    roleName: 'SPECTATOR',
    status: 'ACTIVE'
  };

  users.push(user);
  saveMockUsers(users);
  return { ...user, password: undefined };
}

export function findMockUserByCredentials({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = getMockUsers().find(
    (item) => String(item.email || '').toLowerCase() === normalizedEmail && item.password === password
  );

  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng trong mock data.');
  }

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function getMockUserById(userId) {
  const normalizedId = Number(userId);
  const user = getMockUsers().find((item) => Number(getUserId(item)) === normalizedId);

  if (!user) return null;

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function updateMockUserRole(userId, roleName) {
  const users = getMockUsers();
  const normalizedId = Number(userId);
  const index = users.findIndex((item) => Number(getUserId(item)) === normalizedId);

  if (index < 0) return null;

  users[index] = {
    ...users[index],
    role: roleName,
    roleName
  };

  saveMockUsers(users);

  const { password: _password, ...safeUser } = users[index];
  return safeUser;
}

export function updateMockUserAccount(userId, payload) {
  const users = getMockUsers();
  const normalizedId = Number(userId);
  const index = users.findIndex((item) => Number(getUserId(item)) === normalizedId);

  if (index < 0) return null;

  users[index] = {
    ...users[index],
    email: String(payload.email || '').trim(),
    phone: String(payload.phone || '').trim()
  };

  saveMockUsers(users);

  const { password: _password, ...safeUser } = users[index];
  return safeUser;
}
