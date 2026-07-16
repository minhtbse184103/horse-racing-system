import { useEffect, useId, useState } from 'react';
import { Eye, ImagePlus, Trash2, Upload } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import ImagePreviewDialog from '../ImagePreviewDialog';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function VenueImageField({
  file,
  existingSrc,
  onSelect,
  onRemove,
  label,
  hint,
  previewAlt,
  required = false
}) {
  const { t } = useLanguage();
  const inputId = useId();
  const [previewSrc, setPreviewSrc] = useState(existingSrc || '');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewSrc(existingSrc || '');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [existingSrc, file]);

  function validateAndSelect(selectedFile) {
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError(t('eventWizardInvalidImageType'));
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(t('eventWizardImageTooLarge'));
      return;
    }

    setError('');
    onSelect(selectedFile);
  }

  function selectFile(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    validateAndSelect(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSelect(event.dataTransfer.files?.[0]);
  }

  function removeImage() {
    setError('');
    setPreviewOpen(false);
    onRemove();
  }

  function openPreview(event) {
    event.preventDefault();
    event.stopPropagation();
    setPreviewOpen(true);
  }

  return (
    <div className="mt-4 border-t border-brown-700/10 pt-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <label
          htmlFor={inputId}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative grid aspect-[16/9] w-full max-w-xs shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed bg-cream-200/40 text-brown-500 outline-none transition focus-within:ring-2 focus-within:ring-brown-500 focus-within:ring-offset-2 ${
            isDragging
              ? 'border-brown-700 bg-gold-400/15 ring-2 ring-brown-500 ring-offset-2'
              : 'border-brown-700/20 hover:border-brown-500 hover:bg-cream-200/70'
          }`}
        >
          {previewSrc ? (
            <>
              <img src={previewSrc} alt={previewAlt || t('eventWizardImagePreviewAlt')} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={openPreview}
                className="absolute right-2 top-2 grid size-9 place-items-center rounded-lg border border-white/70 bg-white/90 text-brown-700 shadow-sm transition hover:bg-cream-100"
                aria-label={t('eventWizardImagePreviewAlt')}
              >
                <Eye size={16} />
              </button>
            </>
          ) : (
            <div className="px-4 text-center">
              <ImagePlus className="mx-auto" size={24} />
              <p className="mt-2 text-xs font-extrabold">{t('eventWizardDropImage')}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{t('eventWizardClickToChooseImage')}</p>
            </div>
          )}
          {isDragging && (
            <div className="absolute inset-0 grid place-items-center bg-cream-100/90 px-4 text-center text-xs font-black text-brown-900">
              {t('eventWizardDropToUpload')}
            </div>
          )}
          <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectFile} aria-required={required} />
        </label>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-brown-900">{label || t('eventWizardVenueImage')}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{hint || t('eventWizardImageHint')}</p>
          <div className="mt-2 min-h-9" aria-live="polite">
            {file && <p className="truncate text-xs font-extrabold text-emerald-700">{t('eventWizardImageSelected', { name: file.name })}</p>}
            {error && <p className="text-xs font-extrabold text-danger">{error}</p>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label htmlFor={inputId} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-brown-700 px-3 text-xs font-extrabold text-white transition hover:bg-brown-900">
              <Upload size={15} /> {previewSrc ? t('eventWizardReplaceImage') : t('eventWizardChooseImage')}
            </label>
            <button
              type="button"
              onClick={removeImage}
              disabled={!previewSrc}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-danger transition hover:bg-red-100 disabled:pointer-events-none disabled:invisible"
            >
              <Trash2 size={15} /> {t('eventWizardRemoveImage')}
            </button>
          </div>
        </div>
      </div>
      <ImagePreviewDialog
        src={previewOpen ? previewSrc : ''}
        alt={previewAlt || t('eventWizardImagePreviewAlt')}
        title={label || t('eventWizardVenueImage')}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
