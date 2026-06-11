import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Trophy, Flag, ClipboardCheck, BarChart3, Award,
  UserCheck, CalendarDays, Eye, Sparkles, Gavel, Rabbit,
} from "lucide-react";
import { useRole, ROLE_LABELS, type Role } from "@/modules/core/lib/role-context";
import { cn } from "@/modules/core/lib/utils";

interface NavItem { to: string; label: string; icon: any; }

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/tournaments", label: "Tournaments", icon: Trophy },
    { to: "/admin/races", label: "Races", icon: Flag },
    { to: "/admin/registrations", label: "Registrations", icon: ClipboardCheck },
    { to: "/admin/leaderboard", label: "Leaderboard", icon: BarChart3 },
    { to: "/admin/prizes", label: "Prizes", icon: Award },
  ],
  owner: [
    { to: "/owner", label: "Dashboard", icon: LayoutDashboard },
    { to: "/owner/horses", label: "My Horses", icon: Rabbit },
    { to: "/owner/register", label: "Register Horse", icon: ClipboardCheck },
  ],
  jockey: [
    { to: "/jockey", label: "Dashboard", icon: LayoutDashboard },
    { to: "/jockey/invitations", label: "Invitations", icon: UserCheck },
    { to: "/jockey/schedule", label: "Schedule", icon: CalendarDays },
  ],
  referee: [
    { to: "/referee", label: "Assigned Races", icon: Gavel },
  ],
  spectator: [
    { to: "/spectator", label: "Live & Tournaments", icon: Eye },
    { to: "/spectator/leaderboard", label: "Leaderboard", icon: BarChart3 },
    { to: "/spectator/predictions", label: "AI Predictions", icon: Sparkles },
  ],
};

export function Sidebar() {
  const { role } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV[role];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-lg leading-tight text-sidebar-foreground">Equestria</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tournament OS</div>
        </div>
      </div>
      <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {ROLE_LABELS[role]}
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
        Prototype · mock data
      </div>
    </aside>
  );
}
