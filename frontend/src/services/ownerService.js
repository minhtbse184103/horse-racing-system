import { httpRequest } from '../api/httpClient';

function normalizePassportNumber(value) {
  return String(value || '').trim().toUpperCase();
}

function firstFileUrl(files) {
  const file = Array.isArray(files) ? files[0] : null;
  return String(file?.url || file?.dataUrl || '').trim();
}

function makeFilePreview(name, url) {
  if (!url) return [];
  return [{ id: url, name, url }];
}

function normalizeHorse(horse) {
  if (!horse) return horse;

  const horsePassportUrl = horse.horsePassportUrl || firstFileUrl(horse.horsePassportImages);
  const healthCertificateUrl = horse.healthCertificateUrl || firstFileUrl(horse.horseCertificateImages);
  const horseImageUrl = horse.horseImageUrl || horse.imgUrl || firstFileUrl(horse.horseImages);

  return {
    ...horse,
    id: horse.id ?? horse.horseId ?? horse.horseID,
    horseId: horse.horseId ?? horse.horseID ?? horse.id,
    healthCertificateExpiryDate: horse.healthCertificateExpiryDate || horse.healthCertExpiry || '',
    horsePassportUrl,
    healthCertificateUrl,
    horseImageUrl,
    horsePassportImages: Array.isArray(horse.horsePassportImages)
      ? horse.horsePassportImages
      : makeFilePreview('Horse Passport', horsePassportUrl),
    horseCertificateImages: Array.isArray(horse.horseCertificateImages)
      ? horse.horseCertificateImages
      : makeFilePreview('Health Certificate', healthCertificateUrl),
    horseImages: Array.isArray(horse.horseImages)
      ? horse.horseImages
      : makeFilePreview('Horse Image', horseImageUrl),
    imgUrl: horseImageUrl
  };
}

function toHorseRequest(payload) {
  return {
    passportNumber: normalizePassportNumber(payload.passportNumber),
    horseName: String(payload.horseName || '').trim(),
    breed: String(payload.breed || '').trim(),
    gender: payload.gender,
    color: String(payload.color || '').trim(),
    dayOfBirth: payload.dayOfBirth,
    weight: payload.weight,
    healthCertificateExpiryDate: payload.healthCertificateExpiryDate || payload.healthCertExpiry,
    horsePassportUrl: payload.horsePassportUrl || firstFileUrl(payload.horsePassportImages),
    healthCertificateUrl: payload.healthCertificateUrl || firstFileUrl(payload.horseCertificateImages),
    horseImageUrl: payload.horseImageUrl || payload.imgUrl || firstFileUrl(payload.horseImages)
  };
}

export async function checkHorsePassportNumber(passportNumber, currentHorseId = null) {
  const normalizedPassport = normalizePassportNumber(passportNumber);

  if (!normalizedPassport) {
    throw new Error('Passport Number la bat buoc.');
  }

  const params = new URLSearchParams({ passportNumber: normalizedPassport });
  if (currentHorseId) params.set('currentHorseId', currentHorseId);

  return httpRequest(`/api/owner/horses/check-passport?${params.toString()}`, {
    fallbackError: 'Khong the kiem tra Passport Number.'
  });
}

export async function getOwnerDashboard() {
  return httpRequest('/api/owner/dashboard', {
    fallbackError: 'Khong the tai bang dieu khien owner.'
  });
}

export async function getOwnerHorses() {
  const horses = await httpRequest('/api/owner/horses', {
    fallbackError: 'Khong the tai danh sach ngua.'
  });

  return Array.isArray(horses) ? horses.map(normalizeHorse) : [];
}

export async function getOwnerHorseById(horseId) {
  const horse = await httpRequest(`/api/owner/horses/${horseId}`, {
    fallbackError: 'Khong the tai chi tiet ngua.'
  });

  return normalizeHorse(horse);
}

export async function createHorse(payload) {
  const horse = await httpRequest('/api/owner/horses', {
    method: 'POST',
    body: toHorseRequest(payload),
    fallbackError: 'Khong the them ngua.'
  });

  return normalizeHorse(horse);
}

export async function updateHorse(horseId, payload) {
  const horse = await httpRequest(`/api/owner/horses/${horseId}`, {
    method: 'PUT',
    body: toHorseRequest(payload),
    fallbackError: 'Khong the cap nhat ngua.'
  });

  return normalizeHorse(horse);
}

export async function deleteHorse(horseId) {
  return httpRequest(`/api/owner/horses/${horseId}`, {
    method: 'DELETE',
    fallbackError: 'Khong the xoa ngua.'
  });
}

export function getTournaments() {
  return httpRequest('/api/tournaments', {
    fallbackError: 'Khong the tai danh sach giai dau.'
  });
}

export function getOwnerInvitations() {
  return httpRequest('/api/owner/invitations', {
    fallbackError: 'Khong the tai loi moi jockey.'
  });
}

export function getOpenOwnerTournaments() {
  return httpRequest('/api/owner/tournament-registrations/open-tournaments', {
    fallbackError: 'Khong the tai danh sach Tournament dang mo dang ky.'
  });
}

export function inviteJockey(payload) {
  return httpRequest('/api/owner/invitations', {
    method: 'POST',
    body: payload,
    fallbackError: 'Khong the gui loi moi jockey.'
  });
}

export function cancelOwnerInvitation(invitationId) {
  return httpRequest(`/api/owner/invitations/${invitationId}/cancel`, {
    method: 'PUT',
    fallbackError: 'Khong the huy loi moi jockey.'
  });
}

export function submitOwnerTournamentRegistration(payload) {
  return httpRequest('/api/owner/tournament-registrations', {
    method: 'POST',
    body: payload,
    fallbackError: 'Khong the dang ky Tournament.'
  });
}
