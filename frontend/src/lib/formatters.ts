export function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString('vi-VN') : '0';
}

export function formatDate(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('vi-VN');
}

export function getUserId(user) {
  return user?.id ?? user?.Id ?? user?.userID ?? user?.userId;
}

export function getHorseId(horse) {
  return horse?.horseId ?? horse?.horseID ?? horse?.id;
}

export function getHorseName(horse) {
  return horse?.horseName ?? horse?.name ?? '';
}

export function emptyHorseForm() {
  return {
    horseName: '',
    breed: '',
    gender: 'MALE',
    color: '',
    dayOfBirth: '',
    weight: '',
    healthCertExpiry: '',
    status: 'ACTIVE'
  };
}

export function toHorsePayload(formValues) {
  return {
    horseName: formValues.horseName.trim(),
    breed: formValues.breed.trim() || null,
    gender: formValues.gender || null,
    color: formValues.color.trim() || null,
    dayOfBirth: formValues.dayOfBirth || null,
    weight: formValues.weight === '' ? null : Number(formValues.weight),
    healthCertExpiry: formValues.healthCertExpiry || null,
    status: formValues.status || 'ACTIVE'
  };
}
