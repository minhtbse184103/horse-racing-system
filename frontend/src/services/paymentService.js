import { httpRequest } from '../api/httpClient';

export function confirmVnpayReturn(searchParams) {
  const query = String(searchParams || '').startsWith('?')
    ? searchParams
    : `?${searchParams || ''}`;

  return httpRequest(`/api/payments/vnpay/confirm${query}`, {
    auth: false,
    fallbackError: 'Unable to confirm the VNPAY payment result.'
  });
}
