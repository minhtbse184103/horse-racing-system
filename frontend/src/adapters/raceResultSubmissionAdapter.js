function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeStatus(value) {
  return String(value || 'UNKNOWN').trim().toUpperCase();
}

export function adaptRaceResultSubmissionSummary(raw = {}) {
  const submissionId = firstDefined(raw.submissionId, raw.id);
  const raceId = firstDefined(raw.raceId, raw.raceID);
  const tournamentId = firstDefined(raw.tournamentId, raw.tournamentID);

  return {
    id: submissionId,
    submissionId,
    raceId,
    raceName: firstDefined(raw.raceName, raw.name, raceId ? `Race #${raceId}` : 'Race'),
    trackName: firstDefined(raw.trackName, raw.track, 'Chưa cập nhật'),
    raceStartTime: firstDefined(raw.raceStartTime, raw.startTime),
    raceEndTime: firstDefined(raw.raceEndTime, raw.endTime),
    tournamentId,
    tournamentName: firstDefined(raw.tournamentName, raw.tournament, tournamentId ? `Tournament #${tournamentId}` : 'Tournament'),
    status: normalizeStatus(raw.status),
    submittedAt: firstDefined(raw.submittedAt, raw.createdAt),
    horseCount: toNumber(firstDefined(raw.horseCount, raw.entryCount, raw.entries?.length), 0),
    refereeName: firstDefined(raw.refereeName, raw.assignedRefereeName, raw.refereeUsername, 'Referee được phân công'),
    refereeComment: firstDefined(raw.refereeComment, raw.reviewComment, raw.comment, '')
  };
}

export function adaptRaceResultSubmissionEntry(raw = {}) {
  const raceEntryId = firstDefined(raw.raceEntryId, raw.raceEntryID);

  return {
    id: firstDefined(raw.submissionEntryId, raw.id, raceEntryId),
    submissionEntryId: firstDefined(raw.submissionEntryId, raw.id),
    raceEntryId,
    startingStall: firstDefined(raw.startingStall, raw.stall, raw.laneNumber),
    finishPosition: firstDefined(raw.finishPosition, raw.rank, raw.position),
    horseName: firstDefined(raw.horseName, raw.horse?.horseName, raw.horse?.name, raceEntryId ? `RaceEntry #${raceEntryId}` : 'Chưa có dữ liệu'),
    ownerName: firstDefined(raw.ownerName, raw.ownerFullName, raw.owner?.fullName, raw.owner?.username, 'Chưa có dữ liệu'),
    jockeyName: firstDefined(raw.jockeyName, raw.jockeyFullName, raw.jockey?.fullName, raw.jockey?.username, 'Chưa có dữ liệu'),
    finishTime: firstDefined(raw.finishTime, raw.time, 'N/A'),
    points: toNumber(raw.points, 0)
  };
}

export function adaptRaceResultReviewAction(raw = {}) {
  return {
    id: firstDefined(raw.reviewActionId, raw.id),
    actorUserId: raw.actorUserId,
    actorRole: raw.actorRole,
    action: normalizeStatus(raw.action),
    comment: raw.comment || '',
    createdAt: raw.createdAt
  };
}

export function adaptRaceResultSubmissionDetail(raw = {}) {
  const summary = adaptRaceResultSubmissionSummary(raw);
  const entries = Array.isArray(raw.entries)
    ? raw.entries.map(adaptRaceResultSubmissionEntry)
    : [];

  return {
    ...summary,
    submittedBy: raw.submittedBy,
    refereeReviewedAt: raw.refereeReviewedAt,
    refereeReviewedBy: raw.refereeReviewedBy,
    refereeComment: raw.refereeComment || '',
    adminReviewedAt: raw.adminReviewedAt,
    adminReviewedBy: raw.adminReviewedBy,
    adminComment: raw.adminComment || '',
    horseCount: entries.length || summary.horseCount,
    entries,
    reviewActions: Array.isArray(raw.reviewActions)
      ? raw.reviewActions.map(adaptRaceResultReviewAction)
      : []
  };
}
