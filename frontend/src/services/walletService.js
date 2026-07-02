import { httpRequest } from '../api/httpClient';

function unwrapApiResponse(response) {
  return response?.data ?? response;
}

export async function getMyWallet() {
  const response = await httpRequest('/api/wallets/me', {
    fallbackError: 'Unable to load wallet information.'
  });
  return unwrapApiResponse(response);
}

export async function createWalletDeposit(amount) {
  const response = await httpRequest('/api/wallets/me/deposits', {
    method: 'POST',
    body: { amount },
    fallbackError: 'Unable to create the top-up transaction.'
  });
  return unwrapApiResponse(response);
}
