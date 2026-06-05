const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getErrorMessage(data, fallbackMessage) {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return fallbackMessage;
}

async function adminRequest(path, options = {}) {
  const token = getStoredToken();

  if (!token) {
    throw new Error('Bạn chưa đăng nhập hoặc token đã hết hạn.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Backend có thể không trả JSON.
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Có lỗi xảy ra. Vui lòng thử lại.'));
  }

  return data;
}

export function getUsers() {
  return adminRequest('/api/admin/users');
}

export function createUser(payload) {
  return adminRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateUser(userId, payload) {
  return adminRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteUser(userId) {
  return adminRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  });
}