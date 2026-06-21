export const tournamentStatusLabels = {
  OPEN_FOR_REGISTRATION: 'Open',
  REGISTRATION_CLOSED: 'Registration closed',
  IN_PROGRESS: 'Running',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const vndNumberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0
});

export function formatVndCurrency(value) {
  const amount = Number(value);
  return `${vndNumberFormatter.format(Number.isFinite(amount) ? amount : 0)} ₫`;
}

export function formatRaceSchedule(race) {
  if (!race?.raceStartTime || !race?.raceEndTime) return 'Schedule not set';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${formatter.format(new Date(race.raceStartTime))} - ${formatter.format(new Date(race.raceEndTime))}`;
}

export const conditionTypeLabels = {
  AGE: 'Age',
  GENDER: 'Gender',
  WEIGHT: 'Weight'
};

export const conditionOperatorLabels = {
  EQ: 'Equals',
  GTE: 'At least',
  LTE: 'At most',
  BETWEEN: 'Between'
};

export function formatTournamentCondition(condition) {
  if (typeof condition === 'string') return condition;

  const type = conditionTypeLabels[condition.type] || condition.type;
  const unit = condition.type === 'AGE' ? ' years' : condition.type === 'WEIGHT' ? ' kg' : '';

  if (condition.type === 'GENDER') {
    const genders = { ANY: 'Any gender', MALE: 'Male', FEMALE: 'Female' };
    return genders[condition.value] || `${type}: ${condition.value}`;
  }

  if (condition.operator === 'BETWEEN') {
    return `${type}: ${condition.minValue}-${condition.maxValue}${unit}`;
  }

  const operators = { EQ: '=', GTE: '>=', LTE: '<=' };
  return `${type}: ${operators[condition.operator] || condition.operator} ${condition.value}${unit}`;
}
