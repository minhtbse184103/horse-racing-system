export function adaptRegistration(registration) {
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
  if (!Array.isArray(registrations)) {
    throw new Error('The registration service returned an invalid response.');
  }

  return registrations.map(adaptRegistration);
}
