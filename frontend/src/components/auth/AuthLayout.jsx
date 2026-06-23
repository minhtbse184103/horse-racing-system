import { CalendarDays, Flag, ShieldCheck, Trophy } from 'lucide-react';
import LanguageToggle from '../common/LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

export default function AuthLayout({ children }) {
  const { t } = useLanguage();
  const features = [
    {
      icon: CalendarDays,
      title: t('featureOperations'),
      description: t('featureOperationsDescription')
    },
    {
      icon: ShieldCheck,
      title: t('featureVerified'),
      description: t('featureVerifiedDescription')
    },
    {
      icon: Flag,
      title: t('featureRaceReady'),
      description: t('featureRaceReadyDescription')
    }
  ];

  return (
    <main className="min-h-screen bg-cream-200 p-3 text-brown-900 sm:p-6 lg:p-8">
      <div className="fixed right-4 top-4 z-50">
        <LanguageToggle />
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-lg border border-brown-700/10 bg-cream-100 shadow-[0_24px_70px_rgba(43,23,16,0.16)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)]">
        <section className="relative hidden overflow-hidden bg-brown-900 px-10 py-12 text-cream-100 lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-14">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-gold-400 text-brown-900">
                <Trophy size={22} strokeWidth={2.5} />
              </span>
              <div>
                <strong className="block text-lg font-extrabold">
                  {t('horseSystem')}
                </strong>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
                  {t('horseRace')}
                </span>
              </div>
            </div>

            <h1 className="mt-16 max-w-2xl text-5xl font-black leading-tight xl:text-6xl">
              {t('authHeadline')}
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-cream-100/70">
              {t('authDescription')}
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                className="rounded-lg border border-cream-100/15 bg-cream-100/5 p-4"
                key={title}
              >
                <Icon className="text-gold-400" size={19} strokeWidth={2.4} />
                <strong className="mt-4 block text-sm font-extrabold">
                  {title}
                </strong>
                <p className="mt-2 text-xs font-medium leading-5 text-cream-100/60">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid place-items-center overflow-y-auto px-5 py-8 sm:px-10 lg:px-12">
          <div className="w-full max-w-lg">{children}</div>
        </section>
      </div>
    </main>
  );
}
