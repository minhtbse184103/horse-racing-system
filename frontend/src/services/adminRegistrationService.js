import { httpRequest } from '../api/httpClient';

export function getRegistrations(status) {
  // FLOW: Admin Registration List / Load / Filter
  // ORDER: 2/8 - Frontend service calls the main admin Registration list endpoint.
  // API: GET /api/admin/registrations?status={status}.
  // Purpose: load Registration data for the Admin Tournament workspace; per-Tournament filtering happens in the UI.
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return httpRequest(`/api/admin/registrations${query}`);
}

export function getPendingRegistrations() {
  // FLOW: Admin Registration List / Load / Filter
  // ORDER: 2ALT/8 - Frontend service can call the pending-only queue endpoint when a pending view is needed.
  // API: GET /api/admin/registrations/pending.
  // Purpose: legacy/alternate pending queue read; active workspace usually uses getRegistrations().
  return httpRequest('/api/admin/registrations/pending');
}

export function getRegistrationHistory() {
  // FLOW: Admin Registration List / Load / Filter
  // ORDER: 2ALT/8 - Frontend service can call the reviewed-history endpoint when a history view is needed.
  // API: GET /api/admin/registrations/history.
  // Purpose: legacy/alternate reviewed-history read; active workspace usually uses getRegistrations().
  return httpRequest('/api/admin/registrations/history');
}

export function approveRegistration(registrationId) {
  // FLOW: Admin Approve Registration
  // ORDER: 5/8 - Frontend service calls the approve endpoint for one Registration.
  // API: PUT /api/admin/registrations/{registrationId}/approve.
  // Purpose: approve one PENDING Registration after backend eligibility validation passes.
  return httpRequest(`/api/admin/registrations/${registrationId}/approve`, {
    method: 'PUT'
  });
}

export function rejectRegistration(registrationId, rejectionReason) {
  // FLOW: Admin Reject Registration
  // ORDER: 4/6 - Frontend service sends rejection reason to backend reject endpoint.
  // API: PUT /api/admin/registrations/{registrationId}/reject.
  // Purpose: persist a rejected Registration decision with the required rejection reason.
  return httpRequest(`/api/admin/registrations/${registrationId}/reject`, {
    method: 'PUT',
    body: { rejectionReason }
  });
}

export function confirmRegistrationRefund(registrationId) {
  return httpRequest(`/api/admin/registrations/${registrationId}/confirm-refund`, {
    method: 'PUT'
  });
}
