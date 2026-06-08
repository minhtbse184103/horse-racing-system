import API_BASE_URL from '../configs/apiConfig';
import { getToken } from '../services/authService';

function getErrorMessage(data, fallbackMessage) {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return fallbackMessage;
}

async function adminRequest(path, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error('Bạn chưa đăng nhập hoặc token đã hết hạn.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Có lỗi xảy ra. Vui lòng thử lại.'));
  }

  return data;
}

export const getUsers = () => adminRequest('/api/admin/users');

export const createUser = (payload) =>
  adminRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateUser = (userId, payload) =>
  adminRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteUser = (userId) =>
  adminRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });
