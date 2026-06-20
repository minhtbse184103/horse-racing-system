import { Activity, BarChart3, ClipboardCheck, Flag, Gauge, Home, Medal, ScrollText, Settings2, Trophy, User, Users, WalletCards } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const spectatorItems = [
  { label: 'Dashboard', to: '/dashboard', icon: Home, end: true },
  { label: 'Horses', to: '/dashboard#horses', icon: Trophy },
  { label: 'Races', to: '/dashboard#races', icon: Flag },
  { label: 'Betting', to: '/dashboard#betting', icon: WalletCards },
  { label: 'Results', to: '/dashboard#results', icon: Medal },
  { label: 'Profile', to: '/profile', icon: User }
];

const adminItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: Gauge, end: true },
  { label: 'Users', to: '/admin/dashboard#users', icon: Users },
  { label: 'Owner Applications', to: '/admin/owner-applications', icon: ClipboardCheck },
  { label: 'Horses', to: '/admin/dashboard#horses', icon: Trophy },
  { label: 'Races', to: '/admin/dashboard#races', icon: Flag },
  { label: 'Results', to: '/admin/dashboard#results', icon: BarChart3 }
];

const ownerItems = [
  { label: 'Dashboard', to: '/owner/dashboard', icon: Home, end: true },
  { label: 'My Horses', to: '/owner/dashboard#horses', icon: Trophy },
  { label: 'Register Horse', to: '/owner/dashboard#register-horse', icon: ScrollText },
  { label: 'Race Registration', to: '/owner/dashboard#race-registration', icon: Flag },
  { label: 'Race Results', to: '/owner/dashboard#results', icon: Medal },
  { label: 'Profile', to: '/profile', icon: User }
];

function getItems(role) {
  if (role === 'Admin') return adminItems;
  if (role === 'Owner') return ownerItems;
  return spectatorItems;
}

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const items = getItems(user?.role);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-slate-900">
      <div className="flex">
        <Sidebar items={items} />
        <div className="min-w-0 flex-1">
          <Navbar />
          <main className="px-4 py-8 md:px-8 xl:px-10">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 shadow-lg backdrop-blur xl:hidden">
        <Activity size={15} className="text-[#1B5E20]" /> {user?.role || 'Spectator'} mode
      </div>
      <div className="fixed bottom-4 right-4 z-40 rounded-full bg-[#1B5E20] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-[#1B5E20]/25">
        EquiRace
      </div>
    </div>
  );
}
