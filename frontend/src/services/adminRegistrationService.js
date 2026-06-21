import { httpRequest } from '../api/httpClient';

export function getRegistrations(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return httpRequest(`/api/admin/registrations${query}`);
}

export function getPendingRegistrations() {
  return httpRequest('/api/admin/registrations/pending');
}

export function getRegistrationHistory() {
  return httpRequest('/api/admin/registrations/history');
}

export function approveRegistration(registrationId) {
  return httpRequest(`/api/admin/registrations/${registrationId}/approve`, {
    method: 'PUT'
  });
}

export function rejectRegistration(registrationId, rejectionReason) {
  return httpRequest(`/api/admin/registrations/${registrationId}/reject`, {
    method: 'PUT',
    body: { rejectionReason }
  });
}
