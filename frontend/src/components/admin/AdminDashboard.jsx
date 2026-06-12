import { useState } from 'react';
import {
  ClipboardCheck,
  Flag,
  Gavel,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Trophy,
  UserCheck,
  Users
} from 'lucide-react';

import AdminOverview from './AdminOverview';
import EventManagement from './events/EventManagement';
import RaceEntryManagement from './raceEntries/RaceEntryManagement';
import RegistrationReview from './registrations/RegistrationReview';
import JockeyReview from './reviews/JockeyReview';
import RefereeAssignmentManagement from './refereeAssignments/RefereeAssignmentManagement';
import HorseReview from './horses/HorseReview';
import UserManagement from './users/UserManagement';
import { formatDisplayLabel } from '../../lib';

const adminNavItems = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'users', label: 'Quản lý người dùng', icon: Users },
  { key: 'events', label: 'Giải đấu', icon: Trophy },
  { key: 'registrations', label: 'Đơn đăng ký', icon: UserCheck },
  { key: 'raceEntries', label: 'Suất tham gia đua', icon: Flag },
  { key: 'jockeyReviews', label: 'Duyệt jockey', icon: ClipboardCheck },
  { key: 'horseReviews', label: 'Duyệt ngựa', icon: ShieldCheck },
  { key: 'refereeAssignments', label: 'Phân công referee', icon: Gavel }
];

export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');

  return (
  <main className="min-h-screen bg-cream-200 text-brown-900 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
    <aside className="flex flex-col border-r border-white/10 bg-brown-900 px-4 py-4 text-white shadow-2xl lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
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
            <button
              key={item.key}
              className={`flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-extrabold transition ${
                active
                  ? 'border-gold-400/40 bg-white/15 text-white shadow-lg'
                  : 'border-transparent text-white/70 hover:border-white/10 hover:bg-white/10 hover:text-white'
              }`}
              type="button"
              onClick={() => setActiveSection(item.key)}
            >
              <Icon className="shrink-0" size={18} strokeWidth={2.4} />
              <span>{item.label}</span>
            </button>
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

    <section className="min-w-0 overflow-x-hidden p-4 md:p-6 xl:p-8">
      {activeSection === 'overview' && (
        <AdminOverview onNavigate={setActiveSection} />
      )}

      {activeSection === 'users' && <UserManagement />}
      {activeSection === 'events' && <EventManagement />}
      {activeSection === 'registrations' && <RegistrationReview />}
      {activeSection === 'raceEntries' && <RaceEntryManagement />}

      {activeSection === 'refereeAssignments' && (
        <RefereeAssignmentManagement />
      )}

      {activeSection === 'jockeyReviews' && <JockeyReview />}
      {activeSection === 'horseReviews' && <HorseReview />}
    </section>
  </main>
);}
