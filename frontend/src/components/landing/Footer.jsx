import { Trophy, Mail } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-brown-900/10 bg-brown-900 text-cream-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-gold-400 text-brown-900">
              <Trophy className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-base font-extrabold tracking-tight">{t('homeBrand')}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/70">
            {t('homeFooterDescription')}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">{t('homeFooterNavigation')}</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href="#home" className="text-cream-100/80 hover:text-cream-100">{t('homeNavHome')}</a></li>
            <li><a href="#tournaments" className="text-cream-100/80 hover:text-cream-100">{t('homeNavTournaments')}</a></li>
            <li><a href="#how-it-works" className="text-cream-100/80 hover:text-cream-100">{t('homeNavProcess')}</a></li>
            <li><a href="#roles" className="text-cream-100/80 hover:text-cream-100">{t('homeNavRoles')}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">{t('homeFooterRoles')}</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href="#roles" className="text-cream-100/80 hover:text-cream-100">Owner</a></li>
            <li><a href="#roles" className="text-cream-100/80 hover:text-cream-100">Jockey</a></li>
            <li><a href="#roles" className="text-cream-100/80 hover:text-cream-100">Admin</a></li>
            <li><a href="#roles" className="text-cream-100/80 hover:text-cream-100">Referee</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">{t('homeFooterContact')}</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex items-center gap-2 text-cream-100/80">
              <Mail className="h-4 w-4" aria-hidden />
              hello@horseracing.example
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream-100/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-cream-100/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{t('homeFooterRights', { year })}</p>
          <p>{t('homeFooterBuiltFor')}</p>
        </div>
      </div>
    </footer>
  );
}
