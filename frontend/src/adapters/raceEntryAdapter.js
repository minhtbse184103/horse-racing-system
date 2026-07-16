export function adaptRaceEntryCandidate(candidate) {
  // FLOW: Admin RaceEntry Assignment Queue Load
  // ORDER: 4A/7 - Adapter maps one backend candidate DTO into the assignment dialog view model.
  // Purpose: convert backend RaceEntryCandidateResponse into the card/list model used by the assignment dialog.
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
  // FLOW: Admin Assigned RaceEntry Load
  // ORDER: 4A/6 - Adapter maps one RaceEntryResponse into the official entry card model.
  // Purpose: convert RaceEntryResponse into the official entry card model, including stall and audit fields.
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
  // FLOW: Admin RaceEntry Assignment Queue Load
  // ORDER: 4B/7 - Adapter validates and maps the candidate array before UI rendering.
  // Purpose: enforce the backend queue shape before the assignment dialog renders candidates.
  if (!Array.isArray(candidates)) throw new Error('The assignment queue returned an invalid response.');
  return candidates.map(adaptRaceEntryCandidate);
}

export function adaptRaceEntries(entries) {
  // FLOW: Admin Assigned RaceEntry Load
  // ORDER: 4B/6 - Adapter validates and maps the by-race RaceEntry response array.
  // Purpose: enforce the by-race RaceEntry response shape before rendering official entries.
  if (!Array.isArray(entries)) throw new Error('The race entry service returned an invalid response.');
  return entries.map(adaptRaceEntry);
}
