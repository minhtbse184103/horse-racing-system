import type { AuthUser, Id } from '../services/authService';
import type { Horse, HorseFormValues, HorsePayload } from '../services/ownerService';

export function formatNumber(value: unknown): string {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString('vi-VN') : '0';
}

export function formatDate(value: unknown): string {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('vi-VN');
}

export function getUserId(user: AuthUser | null | undefined): Id | undefined {
  return user?.id ?? user?.Id ?? user?.userID ?? user?.userId;
}

export function getUserRole(user: AuthUser | null | undefined): string {
  const rawRole =
    user?.role ??
    user?.roleName ??
    user?.userRole ??
    user?.authorities?.[0]?.authority ??
    (typeof user?.roles?.[0] === 'object' ? user.roles[0]?.name : user?.roles?.[0]);

  if (!rawRole) return '';
  return String(rawRole).replace(/^ROLE_/i, '').trim().toUpperCase();
}

export function getHorseId(horse: Horse | null | undefined): Id | undefined {
  return horse?.horseId ?? horse?.horseID ?? horse?.id;
}

export function getHorseName(horse: Horse | null | undefined): string {
  return String(horse?.horseName ?? horse?.name ?? '').trim();
}

export function emptyHorseForm(): HorseFormValues {
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

export function toHorsePayload(formValues: HorseFormValues): HorsePayload {
  const horseName = String(formValues.horseName ?? '').trim();
  const weight = Number(formValues.weight);

  return {
    horseName,
    breed: formValues.breed.trim() || null,
    gender: formValues.gender || null,
    color: formValues.color.trim() || null,
    dayOfBirth: formValues.dayOfBirth || null,
    weight,
    healthCertExpiry: formValues.healthCertExpiry || null,
    status: formValues.status || null
  };
}
