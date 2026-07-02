export const tournamentStatusLabels = {
  OPEN_FOR_REGISTRATION: 'Open Registration',
  REGISTRATION_CLOSED: 'Registration Closed',
  READY: 'Ready',
  IN_PROGRESS: 'Ongoing',
  PENDING_REVIEW: 'Pending result review',
  COMPLETED: 'COMPLETED',
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
  if (!race?.raceStartTime || !race?.raceEndTime) return 'Chưa thiết lập lịch';

  const formatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${formatter.format(new Date(race.raceStartTime))} - ${formatter.format(new Date(race.raceEndTime))}`;
}

export const conditionTypeLabels = {
  AGE: 'Tuổi',
  GENDER: 'Giới tính',
  WEIGHT: 'Cân nặng'
};

export const conditionOperatorLabels = {
  EQ: 'Bằng',
  GTE: 'Tối thiểu',
  LTE: 'Tối đa',
  BETWEEN: 'Trong khoảng'
};

export function formatTournamentCondition(condition) {
  if (typeof condition === 'string') return condition;

  const type = conditionTypeLabels[condition.type] || condition.type;
  const unit = condition.type === 'AGE' ? ' tuổi' : condition.type === 'WEIGHT' ? ' kg' : '';

  if (condition.type === 'GENDER') {
    const genders = { ANY: 'Mọi giới tính', MALE: 'Đực', FEMALE: 'Cái' };
    return genders[condition.value] || `${type}: ${condition.value}`;
  }

  if (condition.operator === 'BETWEEN') {
    return `${type}: ${condition.minValue}-${condition.maxValue}${unit}`;
  }

  const operators = { EQ: '=', GTE: '>=', LTE: '<=' };
  return `${type}: ${operators[condition.operator] || condition.operator} ${condition.value}${unit}`;
}
