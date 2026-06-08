import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { useRole } from "@/modules/core/lib/role-context";
import { registrations, races, horses } from "@/modules/core/lib/mock-data";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";

export const Route = createFileRoute("/jockey/schedule")({
  component: SchedulePage,
});

function SchedulePage() {
  const { activeId } = useRole();
  const items = registrations.filter(r => r.jockeyId === activeId && r.invitationStatus === "Accepted")
    .map(r => ({ r, race: races.find(x => x.id === r.raceId)!, horse: horses.find(h => h.id === r.horseId)! }))
    .filter(x => x.race)
    .sort((a,b) => +new Date(a.race.dateTime) - +new Date(b.race.dateTime));

  return (
    <div>
      <PageHeader title="My Schedule" subtitle="Confirmed and upcoming rides" />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">When</th><th>Race</th><th>Horse</th><th>Track</th><th>Lane</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.map(({ r, race, horse }) => (
              <tr key={r.id} className="border-t border-border/60">
                <td className="px-4 py-3">{new Date(race.dateTime).toLocaleString()}</td>
                <td>{race.category} · {race.raceClass}</td>
                <td className="font-medium">{horse?.name}</td>
                <td>{race.track}</td>
                <td>{r.lane}</td>
                <td><StatusBadge variant={statusVariant(race.status)}>{race.status}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
