import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export default function ImagePreviewDialog({ src, alt, title, onClose }) {
  const { t } = useLanguage();

  if (!src) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] grid place-items-center bg-brown-900/75 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ y: 16, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-5xl overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_34px_90px_rgba(43,23,16,0.48)]"
        role="dialog"
        aria-modal="true"
        aria-label={title || alt || t('eventWizardImagePreviewAlt')}
      >
        <header className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-white/85 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-brown-500">{t('eventWizardImagePreviewAlt')}</p>
            {title && <h3 className="mt-0.5 truncate text-lg font-black text-brown-900">{title}</h3>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 transition hover:bg-cream-200"
            aria-label={t('eventCommonClose')}
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[78vh] overflow-auto bg-brown-900/5 p-3">
          <img
            src={src}
            alt={alt || title || t('eventWizardImagePreviewAlt')}
            className="mx-auto max-h-[72vh] w-auto max-w-full rounded-lg object-contain shadow-[0_18px_50px_rgba(43,23,16,0.24)]"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
