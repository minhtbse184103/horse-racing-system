import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClipboardCheck,
  FileText,
  Gavel,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Trophy,
  Users,
  Wallet
} from 'lucide-react';

import AdminOverview from './AdminOverview';
import TournamentWorkspace from './events/TournamentWorkspace';
import HorseReview from './horses/HorseReview';
import JockeyReview from './reviews/JockeyReview';
import RefereeAssignmentManagement from './refereeAssignments/RefereeAssignmentManagement';
import OwnerApplicationManagement from './ownerApplications/OwnerApplicationManagement';
import UserManagement from './users/UserManagement';
import { formatDisplayLabel } from '../../lib';
import { tapPress } from './ui/motion';
import LanguageToggle from '../common/LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';
import WalletTransferPanel from '../payment/WalletTransferPanel';

const adminNavItems = [
  {
    key: 'overview',
    labelKey: 'overview',
    descriptionKey: 'overviewDescription',
    icon: LayoutDashboard
  },
  {
    key: 'users',
    labelKey: 'manageUsers',
    descriptionKey: 'usersDescription',
    icon: Users
  },
  {
    key: 'ownerApplications',
    labelKey: 'manageOwners',
    descriptionKey: 'ownersDescription',
    icon: FileText
  },
  {
    key: 'events',
    labelKey: 'tournament',
    descriptionKey: 'tournamentDescription',
    icon: Trophy
  },
  {
    key: 'jockeyReviews',
    labelKey: 'manageJockeys',
    descriptionKey: 'jockeysDescription',
    icon: ClipboardCheck
  },
  {
    key: 'horseReviews',
    labelKey: 'manageHorses',
    descriptionKey: 'horsesDescription',
    icon: ShieldCheck
  },
  {
    key: 'refereeAssignments',
    labelKey: 'refereeAssignments',
    descriptionKey: 'refereeDescription',
    icon: Gavel
  },
  {
    key: 'wallet',
    labelKey: 'wallet',
    descriptionKey: 'walletDescription',
    icon: Wallet
  }
];

export default function AdminDashboard({ currentUser, onLogout }) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('vnp_TxnRef') || params.has('vnp_SecureHash')) return 'wallet';
    return params.get('section') || 'overview';
  });
  const adminName =
    currentUser?.username || currentUser?.fullName || currentUser?.email || 'Admin';
  const activeNavItem =
    adminNavItems.find((item) => item.key === activeSection) || adminNavItems[0];

  const activeContent = {
    overview: <AdminOverview onNavigate={setActiveSection} />,
    users: <UserManagement />,
    ownerApplications: <OwnerApplicationManagement />,
    events: <TournamentWorkspace adminName={adminName} />,
    refereeAssignments: <RefereeAssignmentManagement />,
    jockeyReviews: <JockeyReview />,
    horseReviews: <HorseReview />,
    wallet: <WalletTransferPanel currentUser={currentUser} role="ADMIN" />
  }[activeSection];

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#fbf5eb_0%,#f4e7d5_55%,#efe0cd_100%)] text-brown-900 lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="relative z-20 flex flex-col overflow-hidden border-b border-white/10 bg-[linear-gradient(165deg,#28130d_0%,#432619_58%,#30180f_100%)] px-4 py-4 text-white shadow-[0_14px_42px_rgba(43,23,16,0.18)] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:shadow-[14px_0_42px_rgba(43,23,16,0.16)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(217,164,65,0.12),transparent)]" />

        <div className="relative flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 shadow-inner">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-gold-400 text-brown-900 shadow-[0_7px_20px_rgba(217,164,65,0.24)]">
            <Trophy size={21} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <strong className="block truncate text-sm font-black">Horse Racing</strong>
            <span className="mt-0.5 block truncate text-[0.7rem] font-bold uppercase text-white/55">
              {t('adminCenter')}
            </span>
          </div>
        </div>

        <div className="relative mt-4 hidden px-2 lg:block">
          <span className="text-[0.65rem] font-extrabold uppercase text-white/40">
            {t('navigation')}
          </span>
        </div>

        <nav
          aria-label={t('navigation')}
          className="relative mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-2 lg:grid-cols-1 lg:gap-1.5"
        >
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;

            return (
              <motion.button
                key={item.key}
                whileHover={{ x: active ? 0 : 2 }}
                whileTap={tapPress}
                className={`group relative flex min-h-14 items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5 text-left transition sm:min-h-16 lg:min-h-[3.6rem] ${
                  active
                    ? 'border-gold-400/35 bg-white/[0.14] text-white shadow-[0_8px_22px_rgba(0,0,0,0.14)]'
                    : 'border-transparent text-white/65 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
                }`}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setActiveSection(item.key)}
              >
                {active && (
                  <motion.span
                    layoutId="admin-nav-active"
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold-400"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-md transition ${
                    active
                      ? 'bg-gold-400 text-brown-900'
                      : 'bg-white/[0.08] text-white/70 group-hover:bg-white/[0.12] group-hover:text-white'
                  }`}
                >
                  <Icon size={16} strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-xs font-extrabold sm:text-sm">
                    {t(item.labelKey)}
                  </strong>
                  <small className="mt-0.5 hidden truncate text-[0.65rem] font-semibold text-white/45 lg:block">
                    {t(item.descriptionKey)}
                  </small>
                </span>
              </motion.button>
            );
          })}
        </nav>

        <div className="relative mt-4 flex items-center gap-2 border-t border-white/10 pt-3 lg:mt-auto lg:block">
          <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2.5 lg:mb-2">
            <span className="text-[0.65rem] font-bold uppercase text-white/45">
              {t('signedInAs')}
            </span>
            <strong className="mt-1 block truncate text-sm font-extrabold">
              {adminName}
            </strong>
            <small className="mt-0.5 block text-[0.68rem] font-extrabold uppercase text-gold-400">
              {formatDisplayLabel(currentUser?.role)}
            </small>
          </div>

          <button
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white px-3 py-2 text-sm font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cream-100 lg:w-full"
            type="button"
            onClick={onLogout}
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
          <div className="mt-2 lg:mt-3">
            <LanguageToggle className="w-full border-white/10 bg-white/95" />
          </div>
        </div>
      </aside>

      <section className="min-w-0 overflow-x-hidden px-4 py-5 sm:px-5 lg:px-6 lg:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1600px]">
          {activeSection !== 'overview' && (
            <div className="mb-5 flex items-center gap-3 border-b border-brown-700/10 pb-4">
              <span className="grid size-10 place-items-center rounded-lg border border-brown-700/10 bg-white/70 text-brown-700 shadow-sm">
                <activeNavItem.icon size={19} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-extrabold uppercase text-brown-500">
                  {t('adminArea')}
                </p>
                <h1 className="truncate text-xl font-black">{t(activeNavItem.labelKey)}</h1>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
