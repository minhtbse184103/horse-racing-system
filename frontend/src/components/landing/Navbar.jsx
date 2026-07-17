import { useState } from "react";
import { Menu, X, Trophy } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const NAV = [
  { href: "#home", labelKey: "homeNavHome" },
  { href: "#racecards", labelKey: "homeNavRaces" },
  { href: "#tournaments", labelKey: "homeNavTournaments" },
  { href: "#how-it-works", labelKey: "homeNavProcess" },
  { href: "#roles", labelKey: "homeNavRoles" },
];

export default function Navbar({ onGoLogin, onGoRegister }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  function navigate(action) {
    setOpen(false);
    action();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brown-900/10 bg-cream-100/85 backdrop-blur supports-[backdrop-filter]:bg-cream-100/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2.5 group">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brown-900 text-gold-400 transition group-hover:bg-brown-700">
            <Trophy className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-base font-extrabold tracking-tight text-brown-900">{t('homeBrand')}</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Điều hướng chính">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-semibold text-brown-900/75 transition hover:text-brown-900">
              {t(n.labelKey)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button type="button" onClick={onGoLogin} className="rounded-md px-4 py-2 text-sm font-semibold text-brown-900 transition hover:bg-cream-200">
            {t('homeLogin')}
          </button>
          <button type="button" onClick={onGoRegister} className="rounded-md bg-brown-900 px-4 py-2 text-sm font-semibold text-cream-100 shadow-sm transition hover:bg-brown-700">
            {t('homeRegister')}
          </button>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md text-brown-900 hover:bg-cream-200 md:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-brown-900/10 bg-cream-100 md:hidden">
          <nav className="flex flex-col px-4 py-3" aria-label="Điều hướng di động">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-semibold text-brown-900 hover:bg-cream-200">
                {t(n.labelKey)}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-brown-900/10 pt-3">
              <button type="button" onClick={() => navigate(onGoLogin)} className="rounded-md border border-brown-900/15 px-3 py-2 text-center text-sm font-semibold text-brown-900 hover:bg-cream-200">
                {t('homeLogin')}
              </button>
              <button type="button" onClick={() => navigate(onGoRegister)} className="rounded-md bg-brown-900 px-3 py-2 text-center text-sm font-semibold text-cream-100 hover:bg-brown-700">
                {t('homeRegister')}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
