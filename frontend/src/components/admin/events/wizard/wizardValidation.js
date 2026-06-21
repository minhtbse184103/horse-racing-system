export function validateWizardStep(step, draft) {
  const errors = {};

  if (step === 1) {
    if (!draft.name.trim()) errors.name = 'Tournament name is required.';
    if (!draft.venue.trim()) errors.venue = 'Venue is required.';
    if (!draft.registrationOpen) errors.registrationOpen = 'Registration open date is required.';
    if (!draft.registrationClose) errors.registrationClose = 'Registration close date is required.';
    if (!draft.start) errors.start = 'Tournament start date is required.';
    if (!draft.end) errors.end = 'Tournament end date is required.';
    if (Number(draft.maxRegistration) < 3) errors.maxRegistration = 'Capacity must be at least 3.';
    if (Number(draft.entryFee) < 0) errors.entryFee = 'Entry fee cannot be negative.';
    if (draft.registrationOpen && draft.registrationClose && draft.registrationClose < draft.registrationOpen) {
      errors.registrationClose = 'Close date must follow the open date.';
    }
    if (draft.registrationClose && draft.start && draft.registrationClose >= draft.start) {
      errors.registrationClose = 'Registration must close before the tournament starts.';
    }
    if (draft.start && draft.end && draft.end < draft.start) {
      errors.end = 'End date must follow the start date.';
    }
  }

  if (step === 2) {
    if (draft.races.length === 0) errors.races = 'Add at least one race before continuing.';
    draft.races.forEach((race) => {
      const prefix = `race-${race.id}`;
      if (!race.name.trim()) errors[`${prefix}-name`] = 'Race name is required.';
      if (!race.track.trim()) errors[`${prefix}-track`] = 'Track is required.';
      if (!race.raceStartTime) errors[`${prefix}-raceStartTime`] = 'Race start time is required.';
      if (!race.raceEndTime) errors[`${prefix}-raceEndTime`] = 'Race end time is required.';
      if (race.raceStartTime && race.raceEndTime && race.raceEndTime <= race.raceStartTime) {
        errors[`${prefix}-raceEndTime`] = 'Race end time must be after the start time.';
      }
      if (race.raceStartTime && draft.start && race.raceStartTime.slice(0, 10) < draft.start) {
        errors[`${prefix}-raceStartTime`] = 'Race start time must be within tournament dates.';
      }
      if (race.raceStartTime && draft.end && race.raceStartTime.slice(0, 10) > draft.end) {
        errors[`${prefix}-raceStartTime`] = 'Race start time must be within tournament dates.';
      }
      if (race.raceEndTime && draft.start && race.raceEndTime.slice(0, 10) < draft.start) {
        errors[`${prefix}-raceEndTime`] = 'Race end time must be within tournament dates.';
      }
      if (race.raceEndTime && draft.end && race.raceEndTime.slice(0, 10) > draft.end) {
        errors[`${prefix}-raceEndTime`] = 'Race end time must be within tournament dates.';
      }
      if (Number(race.distance) <= 0) errors[`${prefix}-distance`] = 'Distance must be greater than zero.';
      if (Number(race.maxRunners) <= 0) errors[`${prefix}-maxRunners`] = 'Runner capacity must be greater than zero.';
    });
  }

  if (step === 3) {
    draft.races.forEach((race) => {
      if (race.prizes.length === 0) errors[`race-${race.id}-prizes`] = `${race.name} needs at least one prize rank.`;
      else if (race.prizes.some((prize) => Number(prize.amount) <= 0)) errors[`race-${race.id}-prizes`] = `${race.name} prize amounts must be greater than zero.`;
      else if (race.prizes.some((prize) => {
        const ownerBasisPoints = Math.round(Number(prize.ownerPercent) * 100);
        const jockeyBasisPoints = Math.round(Number(prize.jockeyPercent) * 100);
        return ownerBasisPoints < 0 || jockeyBasisPoints < 0 || ownerBasisPoints + jockeyBasisPoints !== 10000;
      })) {
        errors[`race-${race.id}-prizes`] = `${race.name} owner and jockey percentages must total 100 for every rank.`;
      }
    });
  }

  return errors;
}
