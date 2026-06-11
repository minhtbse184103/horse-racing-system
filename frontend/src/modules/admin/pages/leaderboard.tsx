import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { useState } from "react";
import { tournaments, races, horses, jockeys, raceResults } from "@/modules/core/lib/mock-data";
import { calculateLeaderboard } from "@/modules/core/lib/calculations";

export const Route = createFileRoute("/admin/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [tid, setTid] = useState(tournaments[0].id);
  const raceIds = races.filter(r => r.tournamentId === tid).map(r => r.id);
  const rows = calculateLeaderboard(raceIds, raceResults, horses, jockeys, races);

  return (
    <div>
      <PageHeader
        title="Tournament Leaderboard"
        subtitle="Cumulative score across confirmed races · lower is better"
        actions={
          <select value={tid} onChange={(e) => setTid(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        }
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No confirmed results yet for this tournament.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Rank</th><th>Horse</th><th>Jockey</th>
                <th>Races</th><th>Wins</th><th>Best time</th><th className="text-right pr-4">Total score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.horseId} className="border-t border-border/60 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-display text-2xl text-primary">{i+1}</td>
                  <td className="font-medium">{row.horseName}</td>
                  <td className="text-muted-foreground">{row.jockeyName}</td>
                  <td>{row.races}</td>
                  <td>{row.wins}</td>
                  <td>{row.bestTime.toFixed(2)}s</td>
                  <td className="pr-4 text-right font-mono">{row.totalScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
