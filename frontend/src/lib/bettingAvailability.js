export const bettingAvailabilityFilters = ['AVAILABLE', 'OPEN', 'UPCOMING', 'CLOSED', 'ALL'];

export function bettingPhase(event, now = Date.now()) {
  const status = String(event?.status || '').toUpperCase();
  const openAt = new Date(event?.openAt).getTime();
  const closeAt = new Date(event?.closeAt).getTime();
  const hasWindow = Number.isFinite(openAt) && Number.isFinite(closeAt);

  if (status === 'OPEN' && hasWindow && now >= openAt && now < closeAt) return 'OPEN';
  if ((status === 'DRAFT' || status === 'OPEN') && hasWindow && now < openAt) return 'UPCOMING';
  return 'CLOSED';
}

export function matchesBettingAvailability(event, filter, now = Date.now()) {
  if (filter === 'ALL') return true;
  const phase = bettingPhase(event, now);
  if (filter === 'AVAILABLE') return phase === 'OPEN' || phase === 'UPCOMING';
  return phase === filter;
}

export function canReceiveBet(event, now = Date.now()) {
  return bettingPhase(event, now) === 'OPEN';
}
