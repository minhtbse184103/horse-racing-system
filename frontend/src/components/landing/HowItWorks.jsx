import { Search, ClipboardList, UserPlus, ShieldCheck, Flag, Trophy } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const STEPS = [
  { icon: Search, titleKey: "homeStepDiscover", descKey: "homeStepDiscoverDesc" },
  { icon: ClipboardList, titleKey: "homeStepRegister", descKey: "homeStepRegisterDesc" },
  { icon: UserPlus, titleKey: "homeStepInvite", descKey: "homeStepInviteDesc" },
  { icon: ShieldCheck, titleKey: "homeStepApprove", descKey: "homeStepApproveDesc" },
  { icon: Flag, titleKey: "homeStepAssign", descKey: "homeStepAssignDesc" },
  { icon: Trophy, titleKey: "homeStepCompete", descKey: "homeStepCompeteDesc" },
];

export default function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section id="how-it-works" className="bg-cream-200 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">{t('homeProcessEyebrow')}</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-brown-900 sm:text-3xl">{t('homeProcessTitle')}</h2>
          <p className="mt-3 text-base text-brown-900/70">
            {t('homeProcessHint')}
          </p>
        </div>

        <ol className="relative mt-8 hidden lg:grid lg:grid-cols-6 lg:gap-5">
          <div className="pointer-events-none absolute left-0 right-0 top-6 h-px bg-brown-900/15" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.titleKey} className="relative flex flex-col items-start">
              <div className="relative z-10 grid h-12 w-12 place-items-center rounded-md border border-brown-900/15 bg-white text-brown-900 shadow-sm">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="mt-4 text-xs font-bold uppercase tracking-wider text-brown-500">
                {t('homeStep')} {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-base font-bold text-brown-900">{t(s.titleKey)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-brown-900/70">{t(s.descKey)}</p>
            </li>
          ))}
        </ol>

        <ol className="relative mt-8 space-y-6 lg:hidden">
          <div className="absolute left-6 top-3 bottom-3 w-px bg-brown-900/15" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.titleKey} className="relative flex gap-5">
              <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-md border border-brown-900/15 bg-white text-brown-900 shadow-sm">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brown-500">
                  {t('homeStep')} {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 text-base font-bold text-brown-900">{t(s.titleKey)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brown-900/70">{t(s.descKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
