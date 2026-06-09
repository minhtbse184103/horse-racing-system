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

export function emptyHorseForm() {
  return {
    name: '',
    breed: '',
    gender: 'MALE',
    age: '',
    weight: '',
    healthCertExpiry: '',
    status: 'ACTIVE'
  };
}

export function toHorsePayload(formValues) {
  return {
    name: formValues.name.trim(),
    breed: formValues.breed.trim() || null,
    gender: formValues.gender || null,
    age: formValues.age === '' ? null : Number(formValues.age),
    weight: formValues.weight === '' ? null : Number(formValues.weight),
    healthCertExpiry: formValues.healthCertExpiry || null,
    status: formValues.status || 'ACTIVE'
  };
}
