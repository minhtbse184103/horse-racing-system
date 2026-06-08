import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { tournaments, races, horses, jockeys, raceResults } from "@/modules/core/lib/mock-data";
import { calculateLeaderboard } from "@/modules/core/lib/calculations";

export const Route = createFileRoute("/spectator/leaderboard")({
  component: () => {
    const t = tournaments[0];
    const rows = calculateLeaderboard(races.filter(r => r.tournamentId === t.id).map(r => r.id), raceResults, horses, jockeys, races);
    return (
      <div>
        <PageHeader title="Live Leaderboard" subtitle={t.name} />
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Rank</th><th>Horse</th><th>Jockey</th><th>Races</th><th>Wins</th><th>Best</th><th className="text-right pr-4">Score</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.horseId} className="border-t border-border/60">
                  <td className="px-4 py-3 font-display text-2xl text-primary">{i+1}</td>
                  <td className="font-medium">{r.horseName}</td>
                  <td className="text-muted-foreground">{r.jockeyName}</td>
                  <td>{r.races}</td><td>{r.wins}</td><td>{r.bestTime.toFixed(2)}s</td>
                  <td className="pr-4 text-right font-mono">{r.totalScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
});
