import { REGISTRATION_FILTER_ALL } from '../operations/operationConstants';
import { includesSearchTerm } from '../operations/operationHelpers';

export function getTournamentRegistrations(registrations, tournamentId) {
  // FLOW: Admin Registration List / Load / Filter
  // ORDER: 7A/8 - UI helper scopes the workspace-wide Registration list to one Tournament.
  // Purpose: scope the workspace-wide Registration data to the currently expanded Tournament.
  return registrations.filter((registration) => registration.tournamentId === tournamentId);
}

export function filterRegistrations(registrations, filters) {
  // FLOW: Admin Registration List / Load / Filter
  // ORDER: 7B/8 - UI helper applies local search/payment/approval filters after backend data is loaded.
  // Purpose: apply UI-only Registration filters after the backend has returned the admin Registration DTOs.
  return registrations.filter((registration) => {
    const matchesPayment = filters.paymentStatus === REGISTRATION_FILTER_ALL
      || registration.paymentStatus === filters.paymentStatus;
    const matchesApproval = filters.approvalStatus === REGISTRATION_FILTER_ALL
      || registration.approvalStatus === filters.approvalStatus;
    const matchesSearch = includesSearchTerm([
      registration.registrationNo,
      registration.tournamentName,
      registration.horse,
      registration.owner,
      registration.jockey,
      registration.paymentStatus,
      registration.approvalStatus
    ], filters.search);

    return matchesPayment && matchesApproval && matchesSearch;
  });
}

export function getRegistrationSummary(registrations) {
  // FLOW: Admin Registration List / Load / Filter
  // ORDER: 7C/8 - UI helper derives panel counts from already-loaded Registration view models.
  // Purpose: derive the Registration header counts shown before the panel expands.
  return registrations.reduce((summary, registration) => {
    summary.total += 1;
    if (registration.approvalStatus === 'PENDING') summary.pending += 1;
    if (registration.approvalStatus === 'APPROVED') summary.approved += 1;
    if (registration.paymentStatus === 'PAID') summary.paid += 1;
    return summary;
  }, { total: 0, pending: 0, approved: 0, paid: 0 });
}
