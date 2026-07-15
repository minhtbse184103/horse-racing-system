import { httpRequest } from '../api/httpClient';

export async function uploadFile(file, folder = 'misc') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await httpRequest('/api/uploads', {
    method: 'POST',
    body: formData,
    fallbackError: 'Khong the upload file.'
  });

  if (!response?.url) {
    throw new Error('Upload succeeded but no file URL was returned.');
  }

  return {
    url: String(response.url),
    publicId: String(response.publicId || ''),
    originalFilename: response.originalFilename || file?.name || '',
    size: response.size ?? file?.size ?? 0,
    contentType: response.contentType || file?.type || ''
  };
}
