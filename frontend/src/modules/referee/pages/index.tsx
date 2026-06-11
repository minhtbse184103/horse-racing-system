import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { useRole } from "@/modules/core/lib/role-context";
import { races, registrations, horses, jockeys } from "@/modules/core/lib/mock-data";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";

export const Route = createFileRoute("/referee/")({
  component: RefereePage,
});

function RefereePage() {
  const { activeId } = useRole();
  const assigned = races.filter(r => r.refereeId === activeId);

  return (
    <div>
      <PageHeader title="Assigned Races" subtitle="Inspect entries and submit official race reports" />
      <div className="grid gap-4 md:grid-cols-2">
        {assigned.map(r => {
          const entries = registrations.filter(x => x.raceId === r.id && x.status === "Approved");
          return (
            <article key={r.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl">{r.category} · {r.raceClass}</h2>
                  <p className="text-xs text-muted-foreground">{new Date(r.dateTime).toLocaleString()} · {r.track} · {r.distance}m</p>
                </div>
                <StatusBadge variant={statusVariant(r.status)}>{r.status}</StatusBadge>
              </div>
              <div className="mt-3 text-sm">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Entries ({entries.length}/{r.laneCount})</div>
                <ul className="mt-2 space-y-1">
                  {entries.map(e => {
                    const h = horses.find(x => x.id === e.horseId);
                    const j = jockeys.find(x => x.id === e.jockeyId);
                    return <li key={e.id} className="text-sm">Lane {e.lane} — {h?.name} <span className="text-muted-foreground">/ {j?.name}</span></li>;
                  })}
                </ul>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/referee/inspect/$raceId" params={{ raceId: r.id }} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  {r.refereeReportSubmitted ? "View report" : "Open inspection"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
