import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClipboardCheck,
  Gavel,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Trophy,
  Users
} from 'lucide-react';

import AdminOverview from './AdminOverview';
import TournamentWorkspace from './events/TournamentWorkspace';
import HorseReview from './horses/HorseReview';
import JockeyReview from './reviews/JockeyReview';
import RefereeAssignmentManagement from './refereeAssignments/RefereeAssignmentManagement';
import UserManagement from './users/UserManagement';
import { formatDisplayLabel } from '../../lib';
import { tapPress } from './ui/motion';

const adminNavItems = [
  {
    key: 'overview',
    label: 'Tổng quan',
    description: 'Tình hình vận hành',
    icon: LayoutDashboard
  },
  {
    key: 'users',
    label: 'Người dùng',
    description: 'Tài khoản và vai trò',
    icon: Users
  },
  {
    key: 'events',
    label: 'Tournament',
    description: 'Sự kiện và Registration',
    icon: Trophy
  },
  {
    key: 'jockeyReviews',
    label: 'Duyệt jockey',
    description: 'Hồ sơ vận động viên',
    icon: ClipboardCheck
  },
  {
    key: 'horseReviews',
    label: 'Duyệt ngựa',
    description: 'Hồ sơ và sức khỏe',
    icon: ShieldCheck
  },
  {
    key: 'refereeAssignments',
    label: 'Phân công Referee',
    description: 'Lịch làm việc Referee',
    icon: Gavel
  }
];

export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
  const adminName = currentUser?.fullName || currentUser?.email || 'Admin';
  const activeNavItem =
    adminNavItems.find((item) => item.key === activeSection) || adminNavItems[0];

  const activeContent = {
    overview: <AdminOverview onNavigate={setActiveSection} />,
    users: <UserManagement />,
    events: <TournamentWorkspace adminName={adminName} />,
    refereeAssignments: <RefereeAssignmentManagement />,
    jockeyReviews: <JockeyReview />,
    horseReviews: <HorseReview />
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
              Trung tâm quản trị
            </span>
          </div>
        </div>

        <div className="relative mt-4 hidden px-2 lg:block">
          <span className="text-[0.65rem] font-extrabold uppercase text-white/40">
            Điều hướng
          </span>
        </div>

        <nav
          aria-label="Điều hướng quản trị"
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
                    {item.label}
                  </strong>
                  <small className="mt-0.5 hidden truncate text-[0.65rem] font-semibold text-white/45 lg:block">
                    {item.description}
                  </small>
                </span>
              </motion.button>
            );
          })}
        </nav>

        <div className="relative mt-4 flex items-center gap-2 border-t border-white/10 pt-3 lg:mt-auto lg:block">
          <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2.5 lg:mb-2">
            <span className="text-[0.65rem] font-bold uppercase text-white/45">
              Đang đăng nhập
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
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
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
                  Khu vực quản trị
                </p>
                <h1 className="truncate text-xl font-black">{activeNavItem.label}</h1>
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
