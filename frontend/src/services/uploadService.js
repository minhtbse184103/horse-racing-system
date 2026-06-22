import { httpRequest } from '../api/httpClient';

export async function uploadFile(file, folder = 'misc') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await httpRequest('/api/upload', {
    method: 'POST',
    body: formData,
    fallbackError: 'Khong the upload file.'
  });

  const url = response && typeof response === 'object' && 'data' in response
    ? response.data
    : response;

  return {
    url: String(url || ''),
    originalFilename: file?.name || '',
    size: file?.size || 0,
    contentType: file?.type || ''
  };
}
