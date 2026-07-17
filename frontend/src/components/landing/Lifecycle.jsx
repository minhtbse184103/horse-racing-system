import { ChevronRight, XCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useLanguage } from "../../context/LanguageContext";

const LIFECYCLE_STAGES = [
  { key: "openforregistration", descriptionKey: "homeLifecycleOpen" },
  { key: "closedregistration", descriptionKey: "homeLifecycleClosed" },
  { key: "ongoing", descriptionKey: "homeLifecycleOngoing" },
  { key: "finished", descriptionKey: "homeLifecycleFinished" },
];

export default function Lifecycle() {
  const { t } = useLanguage();
  return (
    <section className="bg-cream-200 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">{t('homeLifecycleEyebrow')}</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-brown-900 sm:text-3xl">{t('homeLifecycleTitle')}</h2>
          <p className="mt-3 text-base text-brown-900/70">{t('homeLifecycleHint')}</p>
        </div>

        <div className="mt-7 flex flex-wrap items-stretch gap-3">
          {LIFECYCLE_STAGES.map((s, i) => (
            <div key={s.key} className="flex items-stretch gap-3">
              <div className="flex w-64 flex-col rounded-lg border border-brown-900/10 bg-white p-4 shadow-sm">
                <StatusBadge status={s.key} />
                <p className="mt-3 text-sm leading-relaxed text-brown-900/75">{t(s.descriptionKey)}</p>
              </div>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <div className="hidden items-center text-brown-900/30 sm:flex" aria-hidden>
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 inline-flex items-center gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          <XCircle className="h-4 w-4" aria-hidden />
          <span><strong className="font-bold">{t('status_CANCELLED')}</strong> - {t('homeCancelledHint')}</span>
        </div>
      </div>
    </section>
  );
}
