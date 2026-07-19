import { httpRequest } from '../api/httpClient';

function unwrap(response) {
  return response?.data ?? response;
}

export async function getFinanceOverview() {
  return unwrap(await httpRequest('/api/admin/finance/overview', {
    fallbackError: 'Unable to load financial overview.'
  }));
}

export async function retryPrizeDistribution(distributionId) {
  return unwrap(await httpRequest(`/api/admin/finance/prize-distributions/${distributionId}/retry`, {
    method: 'POST',
    fallbackError: 'Unable to retry prize payout.'
  }));
}
