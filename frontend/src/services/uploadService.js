import { httpRequest } from '../api/httpClient';

export async function uploadFile(file, folder = 'misc') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  return httpRequest('/api/uploads', {
    method: 'POST',
    body: formData,
    fallbackError: 'Khong the upload file.'
  });
}
