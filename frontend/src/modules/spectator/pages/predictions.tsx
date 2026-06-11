import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { predictions, races, horses } from "@/modules/core/lib/mock-data";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/spectator/predictions")({
  component: () => {
    const byRace = new Map<string, typeof predictions>();
    for (const p of predictions) byRace.set(p.raceId, [...(byRace.get(p.raceId) ?? []), p]);
    return (
      <div>
        <PageHeader title="AI Predictions" subtitle="Prototype model · for entertainment & reward points only · no real-money betting" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...byRace.entries()].map(([raceId, preds]) => {
            const race = races.find(r => r.id === raceId);
            return (
              <article key={raceId} className="rounded-2xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <h2 className="font-display text-xl">{race?.category} · {race?.raceClass}</h2>
                    <p className="text-xs text-muted-foreground">{race && new Date(race.dateTime).toLocaleString()}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {preds.sort((a,b) => a.predictedRank - b.predictedRank).map(p => {
                    const h = horses.find(x => x.id === p.horseId);
                    return (
                      <li key={p.id} className="rounded-lg bg-secondary/50 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-display text-xl text-primary">{p.predictedRank}</span>
                            <span className="font-medium">{h?.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{p.confidence}% confidence</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                          <div className="h-full bg-primary" style={{ width: `${p.confidence}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    );
  },
});
