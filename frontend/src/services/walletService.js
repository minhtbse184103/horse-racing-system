import { httpRequest } from '../api/httpClient';

function unwrapApiResponse(response) {
  return response?.data ?? response;
}

export async function getMyWallet() {
  const response = await httpRequest('/api/wallets/me', {
    fallbackError: 'Khong the tai thong tin vi.'
  });
  return unwrapApiResponse(response);
}

export async function createWalletDeposit(amount) {
  const response = await httpRequest('/api/wallets/me/deposits', {
    method: 'POST',
    body: { amount },
    fallbackError: 'Khong the tao giao dich chuyen tien.'
  });
  return unwrapApiResponse(response);
}
