import { httpRequest } from '../api/httpClient';

export function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  return httpRequest('/api/uploads/images', {
    method: 'POST',
    body: formData,
    fallbackError: 'Unable to upload the image to Cloudinary.'
  });
}
