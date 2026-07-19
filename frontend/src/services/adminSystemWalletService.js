import { httpRequest } from '../api/httpClient';

function unwrap(response) {
  return response?.data ?? response;
}

export async function getAdminSystemWallet() {
  return unwrap(await httpRequest('/api/admin/system-wallet', {
    fallbackError: 'Unable to load system wallet.'
  }));
}
