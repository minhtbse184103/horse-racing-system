import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClipboardCheck,
  Gavel,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Trophy,
  Users
} from 'lucide-react';

import AdminOverview from './AdminOverview';
import TournamentWorkspace from './events/TournamentWorkspace';
import JockeyReview from './reviews/JockeyReview';
import RefereeAssignmentManagement from './refereeAssignments/RefereeAssignmentManagement';
import HorseReview from './horses/HorseReview';
import UserManagement from './users/UserManagement';
import { formatDisplayLabel } from '../../lib';
import { tapPress } from './ui/motion';

const adminNavItems = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'users', label: 'Quản lý người dùng', icon: Users },
  { key: 'events', label: 'Giải đấu', icon: Trophy },
  { key: 'jockeyReviews', label: 'Duyệt jockey', icon: ClipboardCheck },
  { key: 'horseReviews', label: 'Duyệt ngựa', icon: ShieldCheck },
  { key: 'refereeAssignments', label: 'Phân công referee', icon: Gavel }
];

export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
  const adminName = currentUser?.fullName || currentUser?.email || 'Admin Test';

  const activeContent = {
    overview: <AdminOverview onNavigate={setActiveSection} />,
    users: <UserManagement />,
    events: <TournamentWorkspace adminName={adminName} />,
    refereeAssignments: <RefereeAssignmentManagement />,
    jockeyReviews: <JockeyReview />,
    horseReviews: <HorseReview />
  }[activeSection];

  return (
  <main className="min-h-screen bg-cream-200 text-brown-900 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
    <aside className="flex flex-col border-r border-white/10 bg-[linear-gradient(180deg,#2b1710_0%,#3a2015_58%,#2b1710_100%)] px-4 py-4 text-white shadow-[12px_0_42px_rgba(43,23,16,0.16)] lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
      <div className="flex items-center gap-3 px-2">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-xl shadow-inner">
          🏇
        </div>

        <div className="min-w-0">
          <strong className="block truncate text-base font-black">
            Horse Racing
          </strong>
          <span className="block truncate text-xs font-semibold text-white/60">
            Admin Dashboard
          </span>
        </div>
      </div>

      <nav className="mt-4 grid gap-1.5">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.key;

          return (
            <motion.button
              key={item.key}
              whileHover={{ x: active ? 0 : 3 }}
              whileTap={tapPress}
              className={`relative flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-extrabold transition ${
                active
                  ? 'border-gold-400/40 bg-white/15 text-white shadow-lg'
                  : 'border-transparent text-white/70 hover:border-white/10 hover:bg-white/10 hover:text-white'
              }`}
              type="button"
              onClick={() => setActiveSection(item.key)}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-active"
                  className="absolute left-0 h-5 w-0.5 rounded-full bg-gold-400"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="shrink-0" size={18} strokeWidth={2.4} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto pt-3">
        <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2.5">
          <span className="text-xs font-bold uppercase text-white/50">
            Signed in as
          </span>

          <strong className="mt-1 block truncate text-sm font-extrabold">
            {currentUser?.fullName || currentUser?.email}
          </strong>

          <small className="mt-0.5 block text-xs font-bold text-gold-400">
            {formatDisplayLabel(currentUser?.role)}
          </small>
        </div>

        <button
          className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-extrabold text-brown-700 transition hover:bg-cream-200"
          type="button"
          onClick={onLogout}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>

    <section className="min-w-0 overflow-x-hidden p-4 md:p-5 xl:p-6 2xl:p-8">
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
    </section>
  </main>
);}
