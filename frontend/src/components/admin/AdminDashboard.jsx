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

const adminNavItems = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'events', label: 'Tournaments', icon: Trophy },
  { key: 'registrations', label: 'Registrations', icon: UserCheck },
  { key: 'raceEntries', label: 'Race Entries', icon: Flag },
  { key: 'jockeyReviews', label: 'Jockey Reviews', icon: ClipboardCheck },
  { key: 'horseReviews', label: 'Horse Reviews', icon: ShieldCheck },
  { key: 'refereeAssignments', label: 'Referee Assignments', icon: Gavel }
];

export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">🏇</div>
          <div>
            <strong>Horse Racing</strong>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <nav className="admin-nav">
          {adminNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                className={`admin-nav-item flex items-center gap-3 ${
                  activeSection === item.key ? 'active' : ''
                }`}
                type="button"
                onClick={() => setActiveSection(item.key)}
              >
                <Icon size={18} strokeWidth={2.4} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="admin-profile">
          <span>Signed in as</span>
          <strong>{currentUser?.fullName || currentUser?.email}</strong>
          <small>{currentUser?.role}</small>
        </div>

        <button
          className="admin-logout flex items-center justify-center gap-2"
          type="button"
          onClick={onLogout}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      <section className="admin-main">
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
  );
}
