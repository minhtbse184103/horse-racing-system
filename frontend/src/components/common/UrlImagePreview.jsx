import { useEffect, useMemo, useState } from 'react';

function isHttpUrl(value) {
  return /^https?:\/\/.+/i.test(String(value || '').trim());
}

function toPreviewImageUrl(value) {
  const url = String(value || '').trim();

  if (!isHttpUrl(url)) return '';

  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'github.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const blobIndex = parts.indexOf('blob');

      if (parts.length >= 5 && blobIndex === 2) {
        const [owner, repo, , branch, ...pathParts] = parts;
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${pathParts.join('/')}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

export default function UrlImagePreview({ url, alt = 'URL image preview', className = '' }) {
  const [failed, setFailed] = useState(false);
  const originalUrl = String(url || '').trim();
  const previewUrl = useMemo(() => toPreviewImageUrl(originalUrl), [originalUrl]);

  useEffect(() => {
    setFailed(false);
  }, [previewUrl]);

  if (!isHttpUrl(originalUrl)) {
    return (
      <div className="mt-4 rounded-lg border border-danger/20 bg-danger-bg px-4 py-6 text-center text-sm font-bold text-danger">
        Không có URL hợp lệ để preview ảnh.
      </div>
    );
  }

  if (failed) {
    return (
      <div className="mt-4 rounded-lg border border-brown-700/15 bg-white px-4 py-6 text-center">
        <p className="text-sm font-extrabold text-brown-900">
          Không thể preview ảnh từ URL này.
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          URL phải là link ảnh trực tiếp, ví dụ file .jpg, .png, .webp hoặc GitHub link dạng /blob/.../image.png. Nếu đây là link repository/folder thì trình duyệt không thể render thành ảnh.
        </p>
        <a
          className="mt-4 inline-flex rounded-lg border border-brown-700/15 bg-cream-200 px-4 py-2 text-sm font-extrabold text-brown-700 underline"
          href={originalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Mở URL gốc
        </a>
      </div>
    );
  }

  return (
    <img
      className={className || 'mt-4 max-h-[60vh] w-full rounded-lg object-contain'}
      src={previewUrl}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}
