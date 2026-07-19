const defaultTranslate = (key, params = {}) =>
  Object.entries(params).reduce((text, [paramKey, value]) => text.replaceAll(`{{${paramKey}}}`, String(value)), key);

function todayDateString() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function currentDateTimeString() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function validateWizardStep(step, draft, t = defaultTranslate) {
  const errors = {};
  const today = todayDateString();
  const now = currentDateTimeString();

  if (step === 1) {
    if (!draft.name.trim()) errors.name = t('eventValidationTournamentNameRequired');
    if (!draft.venue.trim()) errors.venue = t('eventValidationVenueRequired');
    if (!draft.registrationOpen) errors.registrationOpen = t('eventValidationRegistrationOpenRequired');
    if (!draft.registrationClose) errors.registrationClose = t('eventValidationRegistrationCloseRequired');
    if (!draft.start) errors.start = t('eventValidationTournamentStartRequired');
    if (!draft.end) errors.end = t('eventValidationTournamentEndRequired');
    if (Number(draft.maxRegistration) < 3) errors.maxRegistration = t('eventValidationCapacityMin3');
    if (Number(draft.entryFee) < 0) errors.entryFee = t('eventValidationEntryFeeNonNegative');
    if (draft.start && draft.start < today) {
      errors.start = t('eventValidationTournamentStartNotPast');
    }
    // Temporarily disabled for demo testing so admins can create historical
    // Registration windows while exercising the full flow end to end.
    // if (draft.registrationClose && draft.registrationClose < today) {
    //   errors.registrationClose = t('eventValidationRegistrationCloseNotPast');
    // }
    if (draft.registrationOpen && draft.registrationClose && draft.registrationClose < draft.registrationOpen) {
      errors.registrationClose = t('eventValidationRegistrationCloseAfterOpen');
    }
    if (draft.registrationClose && draft.start && draft.registrationClose >= draft.start) {
      errors.registrationClose = t('eventValidationRegistrationCloseBeforeTournament');
    }
    if (draft.start && draft.end && draft.end < draft.start) {
      errors.end = t('eventValidationTournamentEndAfterStart');
    }
  }

  if (step === 2) {
    if (draft.races.length === 0) errors.races = t('eventValidationAtLeastOneRace');
    draft.races.forEach((race) => {
      const prefix = `race-${race.id}`;
      if (!race.name.trim()) errors[`${prefix}-name`] = t('eventValidationRaceNameRequired');
      if (!race.track.trim()) errors[`${prefix}-track`] = t('eventValidationRaceTrackRequired');
      if (!race.raceStartTime) errors[`${prefix}-raceStartTime`] = t('eventValidationRaceStartRequired');
      if (!race.raceEndTime) errors[`${prefix}-raceEndTime`] = t('eventValidationRaceEndRequired');
      if (race.raceStartTime && race.raceStartTime <= now) {
        errors[`${prefix}-raceStartTime`] = t('eventValidationRaceStartFuture');
      }
      if (race.raceStartTime && race.raceEndTime && race.raceEndTime <= race.raceStartTime) {
        errors[`${prefix}-raceEndTime`] = t('eventValidationRaceEndAfterStart');
      }
      if (race.entryFinalizationScheduledAt && race.raceStartTime) {
        const finalizeTime = new Date(race.entryFinalizationScheduledAt).getTime();
        const minimumFinalizeTime = new Date(race.raceStartTime).getTime() - (2 * 24 * 60 * 60 * 1000);
        if (finalizeTime > minimumFinalizeTime) {
          errors[`${prefix}-entryFinalizationScheduledAt`] = t('eventValidationEntryFinalizeTwoDays');
        }
      }
      if (race.raceStartTime && draft.start && race.raceStartTime.slice(0, 10) < draft.start) {
        errors[`${prefix}-raceStartTime`] = t('eventValidationRaceWithinTournament');
      }
      if (race.raceStartTime && draft.end && race.raceStartTime.slice(0, 10) > draft.end) {
        errors[`${prefix}-raceStartTime`] = t('eventValidationRaceWithinTournament');
      }
      if (race.raceEndTime && draft.start && race.raceEndTime.slice(0, 10) < draft.start) {
        errors[`${prefix}-raceEndTime`] = t('eventValidationRaceWithinTournament');
      }
      if (race.raceEndTime && draft.end && race.raceEndTime.slice(0, 10) > draft.end) {
        errors[`${prefix}-raceEndTime`] = t('eventValidationRaceWithinTournament');
      }
      if (Number(race.distance) <= 0) errors[`${prefix}-distance`] = t('eventValidationRaceDistancePositive');
      if (Number(race.maxRunners) < 3) errors[`${prefix}-maxRunners`] = t('eventValidationRaceCapacityMin3');
      if (Number(race.maxRunners) > 6) errors[`${prefix}-maxRunners`] = t('eventValidationRaceCapacityMax6');
    });
  }

  if (step === 3) {
    draft.races.forEach((race) => {
      if (race.prizes.length === 0) errors[`race-${race.id}-prizes`] = t('eventValidationRacePrizeRequired', { raceName: race.name });
      else if (race.prizes.some((prize) => Number(prize.amount) <= 0)) errors[`race-${race.id}-prizes`] = t('eventValidationRacePrizePositive', { raceName: race.name });
      else if (race.prizes.some((prize) => {
        const ownerBasisPoints = Math.round(Number(prize.ownerPercent) * 100);
        const jockeyBasisPoints = Math.round(Number(prize.jockeyPercent) * 100);
        return ownerBasisPoints < 0 || jockeyBasisPoints < 0 || ownerBasisPoints + jockeyBasisPoints !== 10000;
      })) {
        errors[`race-${race.id}-prizes`] = t('eventValidationRacePrizeSplit', { raceName: race.name });
      }
    });
  }

  return errors;
}
