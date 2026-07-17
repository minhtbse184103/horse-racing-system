import { useLanguage } from "../../context/LanguageContext";

export default function FinalCTA({ onGoLogin, onGoRegister }) {
  const { t } = useLanguage();
  return (
    <section className="bg-cream-100 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-brown-900 sm:text-4xl">{t('homeCtaTitle')}</h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-brown-900/70 sm:text-lg">
          {t('homeCtaHint')}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={onGoRegister} className="rounded-md bg-brown-900 px-6 py-3 text-sm font-bold text-cream-100 shadow-sm transition hover:bg-brown-700">
            {t('homeRegister')}
          </button>
          <button type="button" onClick={onGoLogin} className="rounded-md border border-brown-900/20 bg-white px-6 py-3 text-sm font-bold text-brown-900 transition hover:bg-cream-200">
            {t('homeLogin')}
          </button>
        </div>
      </div>
    </section>
  );
}
