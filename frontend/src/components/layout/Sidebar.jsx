import { NavLink } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { cn } from '../../lib/classNames.js';

export default function Sidebar({ items }) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/70 bg-white/90 px-5 py-6 shadow-sm backdrop-blur xl:block">
      <NavLink to="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1B5E20] text-[#D4AF37] shadow-lg shadow-[#1B5E20]/20">
          <Trophy size={22} />
        </span>
        <span>
          <span className="block text-lg font-black tracking-tight text-slate-950">EquiRace</span>
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Management</span>
        </span>
      </NavLink>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition',
                  isActive
                    ? 'bg-[#1B5E20] text-white shadow-lg shadow-[#1B5E20]/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
