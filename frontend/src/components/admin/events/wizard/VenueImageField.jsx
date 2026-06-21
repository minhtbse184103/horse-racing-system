import { useEffect, useId, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function VenueImageField({ file, existingSrc, onSelect, onRemove }) {
  const inputId = useId();
  const [previewSrc, setPreviewSrc] = useState(existingSrc || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewSrc(existingSrc || '');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [existingSrc, file]);

  function selectFile(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Vui lòng chọn hình JPEG, PNG hoặc WebP.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Hình địa điểm không được vượt quá 5MB.');
      return;
    }

    setError('');
    onSelect(selectedFile);
  }

  function removeImage() {
    setError('');
    onRemove();
  }

  return (
    <div className="mt-4 border-t border-brown-700/10 pt-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative grid aspect-[16/9] w-full max-w-xs shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-brown-700/20 bg-cream-200/40 text-brown-500">
          {previewSrc ? (
            <img src={previewSrc} alt="Xem trước hình địa điểm" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center"><ImagePlus className="mx-auto" size={24} /><p className="mt-2 text-xs font-extrabold">Chưa có hình địa điểm</p></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-brown-900">Hình địa điểm</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Không bắt buộc. Chấp nhận JPEG, PNG hoặc WebP tối đa 5MB. Hình chỉ được tải lên sau khi lưu Tournament.</p>
          {file && <p className="mt-2 truncate text-xs font-extrabold text-emerald-700">Đã chọn: {file.name}</p>}
          {error && <p className="mt-2 text-xs font-extrabold text-danger">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <label htmlFor={inputId} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-brown-700 px-3 text-xs font-extrabold text-white transition hover:bg-brown-900">
              <Upload size={15} /> {previewSrc ? 'Thay hình' : 'Chọn hình'}
            </label>
            <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectFile} />
            {previewSrc && (
              <button type="button" onClick={removeImage} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-danger hover:bg-red-100">
                <Trash2 size={15} /> Xóa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
