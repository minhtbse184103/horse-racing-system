import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { language, toggleLanguage, t } = useLanguage();
  const nextLanguage = language === 'vi' ? 'EN' : 'VI';
  const label = language === 'vi' ? t('vietnamese') : t('english');

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white/90 px-3 py-2 text-xs font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cream-100 ${className}`}
      type="button"
      onClick={toggleLanguage}
      aria-label={`${t('languageLabel')}: ${label}`}
      title={`${t('languageLabel')}: ${label}`}
    >
      <Languages size={15} strokeWidth={2.4} />
      <span>{nextLanguage}</span>
    </button>
  );
}
