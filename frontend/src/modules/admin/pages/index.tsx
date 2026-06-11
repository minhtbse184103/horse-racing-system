import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { StatCard } from "@/modules/core/components/stat-card";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";
import { WarningPanel } from "@/modules/core/components/warning-panel";
import { tournaments, races, registrations, horses, jockeys, raceResults } from "@/modules/core/lib/mock-data";
import { detectScheduleConflicts, calculateLeaderboard } from "@/modules/core/lib/calculations";
import { Trophy, Flag, Users, ClipboardCheck, Gavel, Rabbit } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const pendingRegs = registrations.filter(r => r.status === "Pending");
  const pendingReports = races.filter(r => r.status === "Live" || (r.status === "Completed" && !r.refereeReportSubmitted));
  const conflicts = detectScheduleConflicts(races, registrations);
  const grandCup = tournaments[0];
  const tournRaceIds = races.filter(r => r.tournamentId === grandCup.id).map(r => r.id);
  const lb = calculateLeaderboard(tournRaceIds, raceResults, horses, jockeys, races).slice(0, 5);

  return (
    <div>
      <PageHeader title="Command Center" subtitle="Tournament operations at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active tournaments" value={tournaments.filter(t => t.status !== "Completed").length} icon={Trophy} hint={`${tournaments.length} total`} />
        <StatCard label="Total horses" value={horses.length} icon={Rabbit} hint={`${horses.filter(h=>h.status==="Active").length} active`} />
        <StatCard label="Total jockeys" value={jockeys.length} icon={Users} hint={`${jockeys.filter(j=>j.status==="Active").length} active`} />
        <StatCard label="Total races" value={races.length} icon={Flag} hint={`${races.filter(r=>r.status==="Completed").length} completed`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Pending registrations</h2>
            <Link to="/admin/registrations" className="text-sm text-primary hover:underline">Review all</Link>
          </div>
          {pendingRegs.length === 0 ? <p className="text-sm text-muted-foreground">All clear.</p> : (
            <ul className="space-y-2">
              {pendingRegs.slice(0, 5).map(reg => {
                const race = races.find(r => r.id === reg.raceId);
                const horse = horses.find(h => h.id === reg.horseId);
                const jockey = jockeys.find(j => j.id === reg.jockeyId);
                return (
                  <li key={reg.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium">{horse?.name} · {jockey?.name}</div>
                      <div className="text-xs text-muted-foreground">{race?.category} · {race?.raceClass}</div>
                    </div>
                    {reg.warnings?.length ? <StatusBadge variant="destructive">{reg.warnings.length} issue{reg.warnings.length>1?"s":""}</StatusBadge> : <StatusBadge variant="primary">Ready</StatusBadge>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-display text-xl">Referee reports pending</h2>
          {pendingReports.length === 0 ? <p className="text-sm text-muted-foreground">No reports awaiting submission.</p> : (
            <ul className="space-y-2">
              {pendingReports.map(r => (
                <li key={r.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{r.category} · {r.track}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.dateTime).toLocaleString()}</div>
                  </div>
                  <StatusBadge variant={statusVariant(r.status)}>{r.status}</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="mt-6">
          <WarningPanel
            variant="destructive"
            title={`${conflicts.length} schedule conflict${conflicts.length>1?"s":""} detected`}
            items={conflicts.map(c => c.message)}
          />
        </div>
      )}

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">{grandCup.name} — Leaderboard</h2>
            <p className="text-xs text-muted-foreground">Live cumulative tournament ranking</p>
          </div>
          <Link to="/admin/leaderboard" className="text-sm text-primary hover:underline">Open</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="py-2">Rank</th><th>Horse</th><th>Jockey</th><th>Races</th><th>Best time</th><th className="text-right">Score</th></tr>
          </thead>
          <tbody>
            {lb.map((row, i) => (
              <tr key={row.horseId} className="border-t border-border/60">
                <td className="py-2 font-display text-lg text-primary">{i + 1}</td>
                <td>{row.horseName}</td>
                <td className="text-muted-foreground">{row.jockeyName}</td>
                <td>{row.races}</td>
                <td>{row.bestTime.toFixed(2)}s</td>
                <td className="text-right font-mono">{row.totalScore.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
