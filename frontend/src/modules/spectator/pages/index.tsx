import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";
import { tournaments, races, horses, jockeys, raceResults } from "@/modules/core/lib/mock-data";

export const Route = createFileRoute("/spectator/")({
  component: SpectatorPage,
});

function SpectatorPage() {
  const live = races.find(r => r.status === "Live");
  const upcoming = races.filter(r => new Date(r.dateTime).getTime() > Date.now()).slice(0, 5);
  const recent = raceResults.filter(r => r.confirmed).slice(0, 6);

  return (
    <div>
      <PageHeader title="Live & Tournaments" subtitle="Follow the world's premier horse racing meets" />

      {live && (
        <section className="mb-6 overflow-hidden rounded-2xl border border-warning/40 bg-gradient-to-br from-warning/10 to-transparent p-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warning"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-warning">Live now</span>
          </div>
          <h2 className="mt-2 font-display text-3xl">{live.category} · {live.raceClass}</h2>
          <p className="text-sm text-muted-foreground">{live.track} · {live.distance}m · {new Date(live.dateTime).toLocaleString()}</p>
          <div className="mt-5 grid grid-cols-6 gap-2">
            {Array.from({ length: live.laneCount }).map((_, i) => (
              <div key={i} className="rounded-lg bg-background p-3 text-center text-xs">
                <div className="font-display text-xl text-primary">{i + 1}</div>
                <div className="text-muted-foreground">Lane</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-display text-xl">Tournaments</h2>
          <ul className="space-y-2">
            {tournaments.map(t => (
              <li key={t.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.location} · {t.startDate} → {t.endDate}</div>
                </div>
                <StatusBadge variant={statusVariant(t.status)}>{t.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-display text-xl">Upcoming races</h2>
          <ul className="space-y-2">
            {upcoming.map(r => (
              <li key={r.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{r.category} · {r.raceClass}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.dateTime).toLocaleString()}</div>
                </div>
                <StatusBadge variant={statusVariant(r.status)}>{r.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="mb-3 font-display text-xl">Recent results</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="py-2">Rank</th><th>Horse</th><th>Jockey</th><th>Time</th></tr>
          </thead>
          <tbody>
            {recent.map(r => {
              const h = horses.find(x => x.id === r.horseId);
              const j = jockeys.find(x => x.id === r.jockeyId);
              return (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="py-2 font-display text-lg text-primary">{r.rank}</td>
                  <td className="font-medium">{h?.name}</td>
                  <td className="text-muted-foreground">{j?.name}</td>
                  <td className="font-mono">{r.finishTime}s</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
