import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { StatCard } from "@/modules/core/components/stat-card";
import { useRole } from "@/modules/core/lib/role-context";
import { jockeys, registrations, races } from "@/modules/core/lib/mock-data";
import { Trophy, Medal, ShieldAlert, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/jockey/")({
  component: JockeyDashboard,
});

function JockeyDashboard() {
  const { activeId } = useRole();
  const j = jockeys.find(x => x.id === activeId)!;
  const myRegs = registrations.filter(r => r.jockeyId === activeId);
  const invites = myRegs.filter(r => r.invitationStatus === "Pending");
  const upcoming = myRegs
    .filter(r => r.invitationStatus === "Accepted")
    .map(r => ({ r, race: races.find(x => x.id === r.raceId)! }))
    .filter(x => x.race && new Date(x.race.dateTime).getTime() > Date.now() - 3600_000)
    .sort((a,b) => +new Date(a.race.dateTime) - +new Date(b.race.dateTime));

  return (
    <div>
      <PageHeader title={j.name} subtitle={`License ${j.license} · Ranking #${j.ranking}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Career wins" value={j.wins} icon={Trophy} />
        <StatCard label="Podiums" value={j.podiumFinishes} icon={Medal} />
        <StatCard label="Violations" value={j.violationCount} icon={ShieldAlert} />
        <StatCard label="Races this week" value={`${j.racesThisWeek}/7`} icon={CalendarDays} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Pending invitations</h2>
            <Link to="/jockey/invitations" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {invites.length === 0 ? <p className="text-sm text-muted-foreground">Nothing waiting for you.</p> : (
            <p className="text-sm">{invites.length} invitation{invites.length>1?"s":""} awaiting your response.</p>
          )}
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-display text-xl">Upcoming schedule</h2>
          <ul className="space-y-2">
            {upcoming.slice(0, 5).map(({ r, race }) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{race.category} · {race.raceClass}</div>
                  <div className="text-xs text-muted-foreground">{new Date(race.dateTime).toLocaleString()} · {race.track}</div>
                </div>
                <span className="text-xs text-muted-foreground">Lane {r.lane}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
