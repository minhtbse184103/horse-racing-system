import { REGISTRATION_FILTER_ALL } from '../operations/operationConstants';
import { includesSearchTerm } from '../operations/operationHelpers';

export function getTournamentRegistrations(registrations, tournamentId) {
  return registrations.filter((registration) => registration.tournamentId === tournamentId);
}

export function filterRegistrations(registrations, filters) {
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
  return registrations.reduce((summary, registration) => {
    summary.total += 1;
    if (registration.approvalStatus === 'PENDING') summary.pending += 1;
    if (registration.approvalStatus === 'APPROVED') summary.approved += 1;
    if (registration.paymentStatus === 'PAID') summary.paid += 1;
    return summary;
  }, { total: 0, pending: 0, approved: 0, paid: 0 });
}
