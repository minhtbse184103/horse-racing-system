import { httpRequest } from '../api/httpClient';
import API_BASE_URL from '../configs/apiConfig';

function firstFileUrl(files) {
  const file = Array.isArray(files) ? files[0] : null;
  return String(file?.url || file?.dataUrl || '').trim();
}

function toAbsoluteFileUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

function inferFileType(url) {
  if (/\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(url)) return 'image/*';
  if (/\.pdf(\?|#|$)/i.test(url)) return 'application/pdf';
  return '';
}

function makeFilePreview(name, url) {
  const absoluteUrl = toAbsoluteFileUrl(url);
  if (!absoluteUrl) return [];
  const fallbackName = decodeURIComponent(absoluteUrl.split('/').pop()?.split('?')[0] || name);
  return [{ id: absoluteUrl, name: fallbackName || name, url: absoluteUrl, type: inferFileType(absoluteUrl) }];
}

function normalizeFilePreview(file, fallbackName) {
  const url = toAbsoluteFileUrl(file?.url || file?.dataUrl);
  return {
    ...file,
    id: file?.id || url || fallbackName,
    name: file?.name || fallbackName,
    url,
    dataUrl: file?.dataUrl,
    type: file?.type || inferFileType(url)
  };
}

function normalizeHorse(horse) {
  if (!horse) return horse;

  const healthCertificateUrl = toAbsoluteFileUrl(horse.healthCertificateUrl || firstFileUrl(horse.horseCertificateImages));

  return {
    ...horse,
    id: horse.id ?? horse.horseId ?? horse.horseID,
    horseId: horse.horseId ?? horse.horseID ?? horse.id,
    healthCertificateExpiryDate: horse.healthCertificateExpiryDate || horse.healthCertExpiry || '',
    healthCertificateUrl,
    horseCertificateImages: Array.isArray(horse.horseCertificateImages)
      ? horse.horseCertificateImages.map((file, index) => normalizeFilePreview(file, `Health Certificate ${index + 1}`))
      : makeFilePreview('Health Certificate', healthCertificateUrl),
    imgUrl: ''
  };
}

function toHorseFormData(payload) {
  const formData = new FormData();
  formData.append('horseName', String(payload.horseName || '').trim());
  formData.append('dayOfBirth', payload.dayOfBirth || '');
  formData.append('weight', String(payload.weight || ''));
  formData.append('colour', String(payload.colour || '').trim());
  formData.append('sex', String(payload.sex || '').trim());
  formData.append('breeding', String(payload.breeding || '').trim());
  formData.append('trainer', String(payload.trainer || '').trim());
  formData.append('healthCertExpiry', payload.healthCertificateExpiryDate || payload.healthCertExpiry || '');
  formData.append('officialHorseProfileUrl', String(payload.officialHorseProfileUrl || '').trim());

  const healthCertificate = Array.isArray(payload.horseCertificateImages) ? payload.horseCertificateImages[0] : null;
  if (healthCertificate?.file) {
    formData.append('healthCertificateFile', healthCertificate.file);
  }

  return formData;
}

export async function getOwnerDashboard() {
  return httpRequest('/api/owner/dashboard', {
    fallbackError: 'Khong the tai bang dieu khien owner.'
  });
}

export async function getOwnerHorses() {
  const horses = await httpRequest('/api/horses/my', {
    fallbackError: 'Khong the tai danh sach ngua.'
  });

  return Array.isArray(horses) ? horses.map(normalizeHorse) : [];
}

export async function getOwnerHorseById(horseId) {
  const horse = await httpRequest(`/api/horses/${horseId}`, {
    fallbackError: 'Khong the tai chi tiet ngua.'
  });

  return normalizeHorse(horse);
}

export async function createHorse(payload) {
  const horse = await httpRequest('/api/horses', {
    method: 'POST',
    body: toHorseFormData(payload),
    fallbackError: 'Khong the them ngua.'
  });

  return normalizeHorse(horse);
}

export async function updateHorse(horseId, payload) {
  const horse = await httpRequest(`/api/horses/${horseId}`, {
    method: 'PUT',
    body: {
      horseName: String(payload.horseName || '').trim(),
      dayOfBirth: payload.dayOfBirth,
      weight: payload.weight,
      colour: String(payload.colour || '').trim(),
      sex: String(payload.sex || '').trim(),
      breeding: String(payload.breeding || '').trim(),
      trainer: String(payload.trainer || '').trim(),
      healthCertificateExpiryDate: payload.healthCertificateExpiryDate || payload.healthCertExpiry,
      officialHorseProfileUrl: String(payload.officialHorseProfileUrl || '').trim()
    },
    fallbackError: 'Khong the cap nhat ngua.'
  });

  return normalizeHorse(horse);
}

export async function deleteHorse(horseId) {
  return httpRequest(`/api/horses/${horseId}`, {
    method: 'DELETE',
    fallbackError: 'Khong the xoa ngua.'
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
