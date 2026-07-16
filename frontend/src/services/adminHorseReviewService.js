import { httpRequest } from '../api/httpClient';

function makeFilePreview(name, url) {
  if (!url) return [];
  return [{ id: url, name, url }];
}

function normalizeHorse(horse) {
  if (!horse) return horse;

  return {
    ...horse,
    id: horse.id ?? horse.horseId ?? horse.horseID,
    horseId: horse.horseId ?? horse.horseID ?? horse.id,
    healthCertificateExpiryDate: horse.healthCertificateExpiryDate || horse.healthCertExpiry || '',
    horseCertificateImages: Array.isArray(horse.horseCertificateImages)
      ? horse.horseCertificateImages
      : makeFilePreview('Health Certificate', horse.healthCertificateUrl),
    imgUrl: ''
  };
}

export async function getHorses(status = '') {
  const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
  const horses = await httpRequest(`/api/admin/horses${query}`, {
    fallbackError: 'Khong the tai ho so ngua.'
  });

  return Array.isArray(horses) ? horses.map(normalizeHorse) : [];
}

export async function getPendingHorses() {
  const horses = await httpRequest('/api/admin/horses?status=PENDING', {
    fallbackError: 'Khong the tai ho so ngua dang cho duyet.'
  });

  return Array.isArray(horses) ? horses.map(normalizeHorse) : [];
}

export async function getAdminHorseDetail(horseId) {
  // FLOW: Admin Registration Entity Detail Popup
  // ORDER: 3HORSE/6 - Frontend service requests enriched Horse evidence for the clicked Registration row.
  // API: GET /api/admin/horses/{horseId}.
  // Purpose: enrich a Registration row with the full Horse profile/evidence shown in the detail modal.
  const horse = await httpRequest(`/api/admin/horses/${horseId}`, {
    fallbackError: 'Khong the tai chi tiet ho so ngua.'
  });

  return normalizeHorse(horse);
}

export async function approveHorse(horseId) {
  const horse = await httpRequest(`/api/admin/horses/${horseId}/approve`, {
    method: 'PUT',
    fallbackError: 'Khong the phe duyet ho so ngua.'
  });

  return normalizeHorse(horse);
}

export async function rejectHorse(horseId, feedback) {
  const horse = await httpRequest(`/api/admin/horses/${horseId}/reject`, {
    method: 'PUT',
    body: { feedback },
    fallbackError: 'Khong the tu choi ho so ngua.'
  });

  return normalizeHorse(horse);
}
