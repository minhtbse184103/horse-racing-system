export const tournamentStatusLabels = {
  OPEN_FOR_REGISTRATION: 'Open Registration',
  REGISTRATION_CLOSED: 'Registration Closed',
  ENTRIES_FINALIZED: 'Entries Finalized',
  READY: 'Ready',
  IN_PROGRESS: 'In Progress',
  PENDING_REVIEW: 'Pending Result Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const vndNumberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0
});

export function formatVndCurrency(value) {
  const amount = Number(value);
  return `${vndNumberFormatter.format(Number.isFinite(amount) ? amount : 0)} VND`;
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

export function getConditionTypeLabel(type, t) {
  if (typeof t === 'function') {
    const translated = t(`eventConditionType_${type}`);
    if (translated && translated !== `eventConditionType_${type}`) return translated;
  }

  return conditionTypeLabels[type] || type;
}

export function getConditionOperatorLabel(operator, t) {
  if (typeof t === 'function') {
    const translated = t(`eventConditionOperator_${operator}`);
    if (translated && translated !== `eventConditionOperator_${operator}`) return translated;
  }

  return conditionOperatorLabels[operator] || operator;
}

export function getConditionGenderLabel(value, t) {
  const gender = String(value || '').toUpperCase();
  if (typeof t === 'function') {
    const translated = t(`eventConditionGender_${gender}`);
    if (translated && translated !== `eventConditionGender_${gender}`) return translated;
  }

  const genders = { ANY: 'Mọi giới tính', MALE: 'Đực', FEMALE: 'Cái' };
  return genders[gender] || value;
}

export function getConditionUnit(type, t) {
  if (type === 'AGE') return typeof t === 'function' ? ` ${t('eventConditionUnitAge')}` : ' tuổi';
  if (type === 'WEIGHT') return typeof t === 'function' ? ` ${t('eventConditionUnitWeight')}` : ' kg';
  return '';
}

export function formatTournamentCondition(condition, t) {
  if (typeof condition === 'string') return condition;

  const typeKey = condition.type || condition.conditionType;
  const type = getConditionTypeLabel(typeKey, t);
  const unit = getConditionUnit(typeKey, t);

  if (typeKey === 'GENDER') {
    return getConditionGenderLabel(condition.value, t) || `${type}: ${condition.value}`;
  }

  if (condition.operator === 'BETWEEN') {
    return `${type}: ${condition.minValue}-${condition.maxValue}${unit}`;
  }

  const operators = { EQ: '=', GTE: '>=', LTE: '<=' };
  return `${type}: ${operators[condition.operator] || condition.operator} ${condition.value}${unit}`;
}
