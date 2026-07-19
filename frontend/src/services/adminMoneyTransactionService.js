import { httpRequest } from '../api/httpClient';

function unwrap(response) {
  return response?.data ?? response;
}

export async function getAdminMoneyTransactions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '' && value !== 'ALL') {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return unwrap(await httpRequest(`/api/admin/money-transactions${query ? `?${query}` : ''}`, {
    fallbackError: 'Unable to load money transactions.'
  }));
}
