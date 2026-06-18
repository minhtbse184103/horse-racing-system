import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout, notifications } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-[#F5F5F5]/85 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">Horse Racing</p>
          <h1 className="text-lg font-black text-slate-950 md:text-xl">Management System</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen((value) => !value)}
              className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:text-[#1B5E20]"
              aria-label="Notifications"
            >
              <Bell size={19} />
              {notifications.some((notification) => !notification.read) && (
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#D4AF37] ring-2 ring-white" />
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-5 py-4">
                  <p className="font-bold text-slate-950">Notifications</p>
                  <p className="text-xs text-slate-500">Application updates and system messages</p>
                </div>
                <div className="max-h-80 overflow-auto p-2">
                  {notifications.length ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="rounded-2xl px-4 py-3 hover:bg-slate-50">
                        <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          {notification.createdAt}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm transition hover:shadow-md"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B5E20] text-sm font-black text-white">
                {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-bold text-slate-950">{user?.username || 'Guest'}</span>
                <span className="block text-xs text-slate-500">{user?.role || 'Spectator'}</span>
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-3xl border border-slate-100 bg-white p-2 shadow-xl">
                <Link to="/profile" className="menu-item" onClick={() => setMenuOpen(false)}>
                  <UserRound size={16} /> Profile
                </Link>
                <button type="button" className="menu-item w-full text-left">
                  <Settings size={16} /> Settings
                </button>
                <button type="button" onClick={handleLogout} className="menu-item w-full text-left text-red-600">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
