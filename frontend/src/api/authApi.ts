import API_BASE_URL from '../configs/apiConfig';

function getErrorMessage(data, fallbackMessage) {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((error) => error.defaultMessage || error.message || String(error))
      .join('\n');
  }
  return fallbackMessage;
}

/**
 * POST /api/auth/login
 * @param {{ email: string, password: string }} payload
 * @returns {{ token: string, user: object }}
 */
export async function loginApi({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Đăng nhập thất bại. Vui lòng thử lại.'));
  }

  if (!data?.token || !data?.user) {
    throw new Error('Response không hợp lệ: thiếu token hoặc user.');
  }

  return data; 
}

/**
 * POST /api/auth/signup
 * @param {{ email, fullName, phone, password, roleName }} payload
 * @returns {object} UserResponse
 */
export async function signupApi({ email, fullName, phone, password, roleName }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, fullName, phone, password, roleName }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Đăng ký thất bại. Vui lòng thử lại.'));
  }

  return data;
}
