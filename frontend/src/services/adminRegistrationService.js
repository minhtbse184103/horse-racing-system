import { httpRequest } from '../api/httpClient';

export function getAcceptedRegistrations() {
  return httpRequest('/api/admin/registrations/accepted');
}

export function getRegistrationHistory() {
  return httpRequest('/api/admin/registrations/history');
}

export function confirmRegistration(registrationId) {
  return httpRequest(`/api/admin/registrations/${registrationId}/confirm`, {
    method: 'PUT'
  });
}

export function rejectRegistration(registrationId) {
  return httpRequest(`/api/admin/registrations/${registrationId}/reject`, {
    method: 'PUT'
  });
}