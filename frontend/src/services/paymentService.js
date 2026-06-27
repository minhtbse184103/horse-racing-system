import { httpRequest } from '../api/httpClient';

export function confirmVnpayReturn(searchParams) {
  const query = String(searchParams || '').startsWith('?')
    ? searchParams
    : `?${searchParams || ''}`;

  return httpRequest(`/api/payments/vnpay/return${query}`, {
    auth: false,
    fallbackError: 'Khong the xac nhan ket qua thanh toan VNPAY.'
  });
}
