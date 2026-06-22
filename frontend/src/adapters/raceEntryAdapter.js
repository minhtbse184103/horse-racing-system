export function adaptRaceEntryCandidate(candidate) {
  return {
    id: candidate.registrationId,
    registrationId: candidate.registrationId,
    registrationNo: candidate.registrationNo || '',
    tournamentId: candidate.tournamentId,
    tournamentName: candidate.tournamentName || '',
    horseId: candidate.horseId,
    horse: candidate.horseName || '',
    horseName: candidate.horseName || '',
    ownerId: candidate.ownerId,
    owner: candidate.ownerName || '',
    ownerName: candidate.ownerName || '',
    jockeyId: candidate.jockeyId,
    jockey: candidate.jockeyName || null,
    jockeyName: candidate.jockeyName || null,
    paymentStatus: candidate.paymentStatus || '',
    approvalStatus: candidate.approvalStatus || '',
    reviewedAt: candidate.reviewedAt || candidate.approvedAt || null
  };
}

export function adaptRaceEntry(entry) {
  return {
    id: entry.raceEntryId,
    raceEntryId: entry.raceEntryId,
    raceId: entry.raceId,
    raceName: entry.raceName || '',
    trackName: entry.trackName || '',
    tournamentId: entry.tournamentId,
    tournamentName: entry.tournamentName || '',
    registrationId: entry.registrationId,
    registrationNo: entry.registrationNo || '',
    horseId: entry.horseId,
    horse: entry.horseName || '',
    horseName: entry.horseName || '',
    ownerId: entry.ownerId,
    owner: entry.ownerName || '',
    ownerName: entry.ownerName || '',
    jockeyId: entry.jockeyId,
    jockey: entry.jockeyName || null,
    jockeyName: entry.jockeyName || null,
    startingStall: entry.startingStall,
    status: entry.status || '',
    assignedById: entry.assignedBy,
    assignedBy: entry.assignedByName || (entry.assignedBy == null ? null : `User #${entry.assignedBy}`),
    assignedByName: entry.assignedByName || null,
    assignedAt: entry.assignedAt || null,
    cancelledAt: entry.cancelledAt || null,
    cancelledBy: entry.cancelledBy,
    cancelledByName: entry.cancelledByName || null,
    cancellationReason: entry.cancellationReason || null
  };
}

export function adaptRaceEntryCandidates(candidates) {
  if (!Array.isArray(candidates)) throw new Error('The assignment queue returned an invalid response.');
  return candidates.map(adaptRaceEntryCandidate);
}

export function adaptRaceEntries(entries) {
  if (!Array.isArray(entries)) throw new Error('The race entry service returned an invalid response.');
  return entries.map(adaptRaceEntry);
}
