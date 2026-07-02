import { useState } from 'react';
import { ClipboardCheck, LogOut, Trophy } from 'lucide-react';
import LanguageToggle from '../common/LanguageToggle';
import RefereeResultReview from './RefereeResultReview';

const refereeNavItems = [
  {
    key: 'resultReview',
    label: 'Duyệt kết quả',
    description: 'Duyệt kết quả Unity',
    icon: ClipboardCheck
  }
];

export default function RefereeDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('resultReview');
  const refereeName =
    currentUser?.username || currentUser?.fullName || currentUser?.email || 'Referee';
  const activeNavItem =
    refereeNavItems.find((item) => item.key === activeSection) || refereeNavItems[0];

  const activeContent = {
    resultReview: <RefereeResultReview />
  }[activeSection];

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#fbf5eb_0%,#f4e7d5_55%,#efe0cd_100%)] text-brown-900 lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="relative z-20 flex flex-col overflow-x-hidden overflow-y-auto border-b border-white/10 bg-[linear-gradient(165deg,#28130d_0%,#432619_58%,#30180f_100%)] px-4 py-4 text-white shadow-[0_14px_42px_rgba(43,23,16,0.18)] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:shadow-[14px_0_42px_rgba(43,23,16,0.16)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(217,164,65,0.12),transparent)]" />

        <div className="relative flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 shadow-inner">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-gold-400 text-brown-900 shadow-[0_7px_20px_rgba(217,164,65,0.24)]">
            <Trophy size={21} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <strong className="block truncate text-sm font-black">Horse Racing</strong>
            <span className="mt-0.5 block truncate text-[0.7rem] font-bold uppercase text-white/55">
              Trung tâm Referee
            </span>
          </div>
        </div>

        <div className="relative mt-4 hidden px-2 lg:block">
          <span className="text-[0.65rem] font-extrabold uppercase text-white/40">
            Điều hướng
          </span>
        </div>

        <nav
          aria-label="Referee navigation"
          className="relative mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:mt-2 lg:grid-cols-1 lg:gap-1.5"
        >
          {refereeNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;

            return (
              <button
                key={item.key}
                className={`group relative flex min-h-14 items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5 text-left transition sm:min-h-16 lg:min-h-[3.6rem] ${
                  active
                    ? 'border-gold-400/35 bg-white/[0.14] text-white shadow-[0_8px_22px_rgba(0,0,0,0.14)]'
                    : 'border-transparent text-white/65 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
                }`}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setActiveSection(item.key)}
              >
                {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold-400" />}
                <span className={`grid size-8 shrink-0 place-items-center rounded-md transition ${
                  active ? 'bg-gold-400 text-brown-900' : 'bg-white/[0.08] text-white/70 group-hover:bg-white/[0.12] group-hover:text-white'
                }`}>
                  <Icon size={16} strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-xs font-extrabold sm:text-sm">{item.label}</strong>
                  <small className="mt-0.5 hidden truncate text-[0.65rem] font-semibold text-white/45 lg:block">
                    {item.description}
                  </small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="relative mt-4 flex items-center gap-2 border-t border-white/10 pt-3 lg:mt-auto lg:block">
          <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2.5 lg:mb-2">
            <span className="text-[0.65rem] font-bold uppercase text-white/45">Đang đăng nhập</span>
            <strong className="mt-1 block truncate text-sm font-extrabold text-white">{refereeName}</strong>
            <small className="mt-0.5 block text-[0.68rem] font-extrabold uppercase text-gold-400">REFEREE</small>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white px-3 py-2 text-sm font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cream-100 lg:w-full"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
          <div className="mt-2 lg:mt-3">
            <LanguageToggle className="w-full border-white/10 bg-white/95" />
          </div>
        </div>
      </aside>

      <section className="min-w-0 overflow-x-hidden px-4 py-5 sm:px-5 lg:px-6 lg:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-5 flex flex-col gap-4 border-b border-brown-700/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-brown-500">
              <span className="h-px w-7 bg-brown-500" /> Trung tâm Referee
            </div>
            <h1 className="mt-2 text-3xl font-black leading-none text-brown-900 lg:text-4xl">
              {activeNavItem.label}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Xem kết quả provisional từ Unity, xác nhận hoặc flag vấn đề để chuyển sang bước Admin review.
            </p>
          </div>
        </header>

        {activeContent}
        </div>
      </section>
    </main>
  );
}
