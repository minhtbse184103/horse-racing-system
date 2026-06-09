import type { AuthUser, Horse, HorseFormValues, HorsePayload, Id } from '../types';

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

export function emptyHorseForm(): HorseFormValues {
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

export function toHorsePayload(formValues: HorseFormValues & { horseName?: string }): HorsePayload {
  const name = String(formValues.name ?? formValues.horseName ?? '').trim();
  const breed = String(formValues.breed ?? '').trim();

  return {
    name,
    horseName: name,
    breed,
    gender: formValues.gender || null,
    age: formValues.age === '' || formValues.age === null ? null : Number(formValues.age),
    weight: formValues.weight === '' || formValues.weight === null ? null : Number(formValues.weight),
    healthCertExpiry: formValues.healthCertExpiry || null,
    status: formValues.status || 'ACTIVE'
  };
}
