import API_BASE_URL from '../configs/apiConfig';

export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}


const MESSAGE_TRANSLATIONS = {
  'Invalid email or password': 'Invalid email or password.',
  'Email already exists': 'An account with this email already exists.',
  'Role not found': 'The selected role is invalid.',
  'Account is not active': 'This account is not active.'
};

function translateMessage(message) {
  if (!message || typeof message !== 'string') return message;
  return MESSAGE_TRANSLATIONS[message] || message;
}

export function getErrorMessage(data, fallbackMessage = 'Something went wrong. Please try again.') {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return translateMessage(data);
  if (typeof data.message === 'string') return translateMessage(data.message);
  if (typeof data.error === 'string') return translateMessage(data.error);
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((error) => translateMessage(error.defaultMessage || error.message || String(error)))
      .join('\n');
  }
  return fallbackMessage;
}

function parseResponseBody(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function httpRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = true,
    headers = {},
    fallbackError = 'Something went wrong. Please try again.'
  } = options;

  const requestHeaders = { ...headers };

  if (!(body instanceof FormData)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }

  if (auth) {
    const token = getStoredToken();
    if (!token) {
      throw new Error('You are not signed in or your session has expired.');
    }
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: requestHeaders
  };

  if (body !== undefined) {
    fetchOptions.body = body instanceof FormData || typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  if (response.status === 204) {
    if (!response.ok) throw new Error(fallbackError);
    return null;
  }

  const text = await response.text();
  const data = parseResponseBody(text);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackError));
  }

  return data;
}
