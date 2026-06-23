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

export async function getPendingHorses() {
  const horses = await httpRequest('/api/admin/horses', {
    fallbackError: 'Khong the tai ho so ngua dang cho duyet.'
  });

  return Array.isArray(horses) ? horses.map(normalizeHorse) : [];
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
