import { Crown, Medal, ShieldCheck, Gavel } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const ROLES = [
  { icon: Crown, title: "Owner", descKey: "homeOwnerDesc" },
  { icon: Medal, title: "Jockey", descKey: "homeJockeyDesc" },
  { icon: ShieldCheck, title: "Admin", descKey: "homeAdminDesc" },
  { icon: Gavel, title: "Referee", descKey: "homeRefereeDesc" },
];

export default function Roles() {
  const { t } = useLanguage();
  return (
    <section id="roles" className="bg-cream-100 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">{t('homeRolesEyebrow')}</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-brown-900 sm:text-3xl">
            {t('homeRolesTitle')}
          </h2>
          <p className="mt-3 text-base text-brown-900/70">{t('homeRolesHint')}</p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-lg border border-brown-900/10 bg-white p-5 shadow-sm transition hover:border-gold-400 hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-brown-900 text-gold-400">
                <r.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-bold text-brown-900">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brown-900/70">{t(r.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
