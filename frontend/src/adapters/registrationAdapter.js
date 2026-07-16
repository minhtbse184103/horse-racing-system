export function adaptRegistration(registration) {
  // FLOW: Admin Registration List / Load / Filter
  // ORDER: 6/8 - Frontend adapter normalizes backend RegistrationResponse into the UI view model.
  // Purpose: normalize backend RegistrationResponse into the view model used by list, review dialog, RaceEntry queue refresh, and entity detail popups.
  const reviewerName = registration.reviewerName || null;

  return {
    id: registration.registrationId,
    registrationNo: registration.registrationNo || '',
    tournamentId: registration.tournamentId,
    tournamentName: registration.tournamentName || '',

    horseId: registration.horseId,
    horse: registration.horseName || '',
    horseName: registration.horseName || '',
    horseBreed: registration.horseBreed || '',
    horseGender: registration.horseGender || '',
    horseDateOfBirth: registration.horseDateOfBirth || null,
    horseWeight: registration.horseWeight,
    horseHealthCertExpiry: registration.horseHealthCertExpiry || null,
    horseStatus: registration.horseStatus || '',

    ownerId: registration.ownerId,
    owner: registration.ownerName || '',
    ownerName: registration.ownerName || '',
    ownerEmail: registration.ownerEmail || '',

    jockeyId: registration.jockeyId,
    jockey: registration.jockeyName || null,
    jockeyName: registration.jockeyName || null,
    jockeyEmail: registration.jockeyEmail || null,

    paymentStatus: registration.paymentStatus || '',
    approvalStatus: registration.approvalStatus || '',
    submittedAt: registration.submittedAt || null,
    reviewedAt: registration.reviewedAt || null,
    reviewerId: registration.reviewedBy,
    reviewerName,
    reviewedBy: reviewerName || (registration.reviewedBy == null ? null : `User #${registration.reviewedBy}`),
    rejectionReason: registration.rejectionReason || null,

    assigned: Boolean(registration.assigned),
    assignedRaceId: registration.assignedRaceId,
    assignedRaceName: registration.assignedRaceName || null,
    createdAt: registration.createdAt || null,
    updatedAt: registration.updatedAt || null
  };
}

export function adaptRegistrations(registrations) {
  // FLOW: Admin Registration List / Load / Filter
  // ORDER: 6A/8 - Frontend adapter guards the list response before storing it in workspace state.
  // Purpose: guard the admin Registration API contract before the workspace stores Registration view models.
  if (!Array.isArray(registrations)) {
    throw new Error('The registration service returned an invalid response.');
  }

  return registrations.map(adaptRegistration);
}
