import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { races } from "@/modules/core/lib/mock-data";

export const Route = createFileRoute("/admin/prizes")({
  component: PrizesPage,
});

function PrizesPage() {
  const split = { owner: 0.5, jockey: 0.3, stable: 0.2 };
  return (
    <div>
      <PageHeader title="Prize Distribution" subtitle="Default split — Owner 50% · Jockey 30% · Stable 20%" />
      <div className="grid gap-4 md:grid-cols-2">
        {races.map(r => (
          <div key={r.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-xl">{r.category} · {r.raceClass}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.dateTime).toLocaleString()} · {r.track}</div>
              </div>
              <div className="font-display text-2xl text-primary">${r.prizePool.toLocaleString()}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-xs text-muted-foreground">Owner</div>
                <div className="font-display text-lg">${(r.prizePool*split.owner).toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-xs text-muted-foreground">Jockey</div>
                <div className="font-display text-lg">${(r.prizePool*split.jockey).toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-xs text-muted-foreground">Stable</div>
                <div className="font-display text-lg">${(r.prizePool*split.stable).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
