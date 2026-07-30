import { httpRequest } from '../api/httpClient';

function unwrap(response) {
  return response?.data ?? response;
}

export async function getBettingEvents() {
  return unwrap(await httpRequest('/api/betting/events', {
    fallbackError: 'Unable to load betting events.'
  }));
}

export async function getBettingEvent(eventId) {
  return unwrap(await httpRequest(`/api/betting/events/${eventId}`, {
    fallbackError: 'Unable to load betting event.'
  }));
}

export async function placeBet(eventId, payload) {
  return unwrap(await httpRequest(`/api/betting/events/${eventId}/tickets`, {
    method: 'POST',
    body: payload,
    fallbackError: 'Unable to place bet.'
  }));
}

export async function getMyBetTickets() {
  return unwrap(await httpRequest('/api/betting/my-tickets', {
    fallbackError: 'Unable to load bet tickets.'
  }));
}

export async function cancelBetTicket(ticketId) {
  return unwrap(await httpRequest(`/api/betting/tickets/${ticketId}/cancel`, {
    method: 'PUT',
    fallbackError: 'Unable to cancel bet ticket.'
  }));
}

export async function getAdminBetProducts() {
  return unwrap(await httpRequest('/api/admin/betting/products', {
    fallbackError: 'Unable to load betting products.'
  }));
}

export async function updateAdminBetProduct(productId, payload) {
  return unwrap(await httpRequest(`/api/admin/betting/products/${productId}`, {
    method: 'PUT',
    body: payload,
    fallbackError: 'Unable to update betting product.'
  }));
}

export async function getAdminBetEvents() {
  return unwrap(await httpRequest('/api/admin/betting/events', {
    fallbackError: 'Unable to load betting events.'
  }));
}

export async function getAdminEligibleBetRaces(betProductId) {
  return unwrap(await httpRequest(`/api/admin/betting/eligible-races?betProductId=${encodeURIComponent(betProductId)}`, {
    fallbackError: 'Unable to load eligible races.'
  }));
}

export async function getAdminBetEventDetail(eventId) {
  return unwrap(await httpRequest(`/api/admin/betting/events/${eventId}`, {
    fallbackError: 'Unable to load betting event details.'
  }));
}

export async function getAdminBetEventTickets(eventId) {
  return unwrap(await httpRequest(`/api/admin/betting/events/${eventId}/tickets`, {
    fallbackError: 'Unable to load betting event tickets.'
  }));
}

export async function createAdminBetEvent(payload) {
  return unwrap(await httpRequest('/api/admin/betting/events', {
    method: 'POST',
    body: payload,
    fallbackError: 'Unable to create betting event.'
  }));
}

export async function openAdminBetEvent(eventId) {
  return unwrap(await httpRequest(`/api/admin/betting/events/${eventId}/open`, {
    method: 'PUT',
    fallbackError: 'Unable to open betting event.'
  }));
}

export async function closeAdminBetEvent(eventId) {
  return unwrap(await httpRequest(`/api/admin/betting/events/${eventId}/close`, {
    method: 'PUT',
    fallbackError: 'Unable to close betting event.'
  }));
}

export async function settleAdminBetEvent(eventId) {
  return unwrap(await httpRequest(`/api/admin/betting/events/${eventId}/settle`, {
    method: 'POST',
    fallbackError: 'Unable to settle betting event.'
  }));
}

export async function getAdminBetSettlements() {
  return unwrap(await httpRequest('/api/admin/betting/settlements', {
    fallbackError: 'Unable to load betting settlements.'
  }));
}

export async function getAdminBetSettlementDetail(settlementId) {
  return unwrap(await httpRequest(`/api/admin/betting/settlements/${settlementId}`, {
    fallbackError: 'Unable to load betting settlement details.'
  }));
}
