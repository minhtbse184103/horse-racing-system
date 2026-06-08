import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { StatCard } from "@/modules/core/components/stat-card";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";
import { useRole } from "@/modules/core/lib/role-context";
import { horses, races, registrations, raceResults } from "@/modules/core/lib/mock-data";
import { Trophy, Rabbit, CalendarDays, Award } from "lucide-react";

export const Route = createFileRoute("/owner/")({
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { activeId } = useRole();
  const myHorses = horses.filter(h => h.ownerId === activeId);
  const myHorseIds = myHorses.map(h => h.id);
  const myRegs = registrations.filter(r => myHorseIds.includes(r.horseId));
  const upcoming = myRegs
    .map(r => ({ reg: r, race: races.find(x => x.id === r.raceId)! }))
    .filter(x => x.race && new Date(x.race.dateTime).getTime() > Date.now() - 86400000);
  const wins = raceResults.filter(rs => myHorseIds.includes(rs.horseId) && rs.rank === 1 && rs.confirmed).length;

  return (
    <div>
      <PageHeader title="Stable Overview" subtitle="Your horses, races, and rewards" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My horses" value={myHorses.length} icon={Rabbit} />
        <StatCard label="Upcoming races" value={upcoming.length} icon={CalendarDays} />
        <StatCard label="Wins this season" value={wins} icon={Trophy} />
        <StatCard label="Estimated rewards" value={`$${(wins*40000).toLocaleString()}`} icon={Award} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Upcoming races</h2>
            <Link to="/owner/register" className="text-sm text-primary hover:underline">Register horse</Link>
          </div>
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">No races scheduled.</p> : (
            <ul className="space-y-2">
              {upcoming.map(({ reg, race }) => {
                const horse = horses.find(h => h.id === reg.horseId);
                return (
                  <li key={reg.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium">{horse?.name} — {race.category}</div>
                      <div className="text-xs text-muted-foreground">{new Date(race.dateTime).toLocaleString()}</div>
                    </div>
                    <StatusBadge variant={statusVariant(reg.status)}>{reg.status}</StatusBadge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-display text-xl">My horses</h2>
          <ul className="space-y-2">
            {myHorses.map(h => (
              <li key={h.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.breed} · {h.age}yo · {h.weight}kg</div>
                </div>
                <StatusBadge variant={statusVariant(h.status)}>{h.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
