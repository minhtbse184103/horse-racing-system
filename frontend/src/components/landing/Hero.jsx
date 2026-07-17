import { ArrowRight } from "lucide-react";
import heroImage from "../../assets/hero-race.svg";
import { useLanguage } from "../../context/LanguageContext";

export default function Hero({ stats, isLoading }) {
  const { t } = useLanguage();
  return (
    <section id="home" className="relative isolate overflow-hidden bg-brown-900 text-cream-100">
      <img
        src={heroImage}
        alt="Ngựa đua lao nhanh khỏi cổng xuất phát"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brown-900/85 via-brown-900/60 to-brown-900/95" aria-hidden />

      <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-4 pb-24 pt-20 sm:px-6 lg:min-h-[620px] lg:px-8 lg:pb-28 lg:pt-24">
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-gold-400/40 bg-brown-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          {t('homeHeroEyebrow')}
        </span>

        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
          {t('homeHeroTitle')}
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream-100/85 sm:text-lg">
          {t('homeHeroDescription')}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a href="#tournaments" className="inline-flex items-center gap-2 rounded-md bg-gold-400 px-5 py-3 text-sm font-bold text-brown-900 shadow-sm transition hover:bg-gold-400/90">
            {t('homeExplore')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-md border border-cream-100/30 bg-brown-900/30 px-5 py-3 text-sm font-bold text-cream-100 backdrop-blur transition hover:bg-brown-900/50">
            {t('homeProcess')}
          </a>
        </div>

        <dl className="mt-9 grid w-fit max-w-full grid-cols-1 gap-px overflow-hidden rounded-lg border border-cream-100/15 bg-cream-100/10 sm:grid-flow-col sm:grid-cols-none sm:auto-cols-max">
          {stats.map((s) => (
            <div key={s.label} className="bg-brown-900/60 px-5 py-4 backdrop-blur">
              <dt className="text-xs font-semibold uppercase tracking-wider text-cream-100/70">{s.label}</dt>
              <dd className="mt-1 text-2xl font-extrabold text-gold-400">
                {isLoading ? "..." : s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-cream-100" aria-hidden />
    </section>
  );
}
