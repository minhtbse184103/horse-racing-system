import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/modules/core/components/app-shell";
import { WarningPanel } from "@/modules/core/components/warning-panel";
import { races, registrations, horses, jockeys, raceResults } from "@/modules/core/lib/mock-data";
import { calcRaceScore } from "@/modules/core/lib/calculations";
import { toast } from "sonner";

export const Route = createFileRoute("/referee/inspect/$raceId")({
  component: InspectionPage,
});

interface Row { regId: string; horseId: string; jockeyId: string; lane: number; finishTime: number; violation: boolean; }

function InspectionPage() {
  const { raceId } = Route.useParams();
  const race = races.find(r => r.id === raceId);

  if (!race) {
    return (
      <div>
        <PageHeader
          title="Race not found"
          subtitle="The requested race does not exist."
          actions={<Link to="/referee" className="text-sm text-primary hover:underline">← Back</Link>}
        />
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-destructive">
          The race with ID <strong>{raceId}</strong> was not found.
        </div>
      </div>
    );
  }

  const entries = registrations.filter(r => r.raceId === raceId && r.status === "Approved");
  const existing = raceResults.filter(rs => rs.raceId === raceId);

  const initialRows: Row[] = entries.map(e => {
    const ex = existing.find(x => x.horseId === e.horseId);
    return {
      regId: e.id, horseId: e.horseId, jockeyId: e.jockeyId, lane: e.lane,
      finishTime: ex?.finishTime ?? 0, violation: ex?.violationFlag ?? false,
    };
  });

  const [rows, setRows] = useState(initialRows);
  const [submitted, setSubmitted] = useState(race.refereeReportSubmitted);

  const ranked = useMemo(() => {
    return [...rows]
      .map(r => {
        const h = horses.find(x => x.id === r.horseId)!;
        const score = r.finishTime > 0 ? calcRaceScore(r.finishTime, race.distance, h.weight) : 0;
        return { ...r, score };
      })
      .sort((a, b) => (a.finishTime || 9999) - (b.finishTime || 9999))
      .map((r, i) => ({ ...r, rank: r.finishTime > 0 ? i + 1 : 0 }));
  }, [rows, race.distance]);

  const eligibilityIssues = entries.flatMap(e => {
    const h = horses.find(x => x.id === e.horseId)!;
    const issues: string[] = [];
    if (new Date(h.certExpiry) < new Date(race.dateTime)) issues.push(`${h.name}: certificate expired`);
    if (h.weight > race.maxHorseWeight) issues.push(`${h.name}: overweight (${h.weight}kg)`);
    return issues;
  });

  const update = (id: string, patch: Partial<Row>) => setRows(rs => rs.map(r => r.regId === id ? { ...r, ...patch } : r));

  const simulate = () => {
    setRows(rs => rs.map((r, i) => ({ ...r, finishTime: +(race.distance / (16 + Math.random() * 2 - i * 0.1)).toFixed(2) })));
    toast.info("Simulated finish times generated");
  };

  const submit = () => { setSubmitted(true); toast.success("Referee report submitted · results finalized · leaderboard recalculated"); };

  return (
    <div>
      <PageHeader
        title={`Inspection — ${race.category}`}
        subtitle={`${race.raceClass} · ${race.track} · ${race.distance}m · ${new Date(race.dateTime).toLocaleString()}`}
        actions={<Link to="/referee" className="text-sm text-primary hover:underline">← Back</Link>}
      />

      {eligibilityIssues.length > 0 && (
        <div className="mb-4"><WarningPanel variant="destructive" title="Pre-race eligibility issues" items={eligibilityIssues} /></div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Lane</th><th>Horse</th><th>Jockey</th><th>Finish (s)</th><th>Score</th><th>Rank</th><th>Violation</th></tr>
          </thead>
          <tbody>
            {ranked.map(r => {
              const h = horses.find(x => x.id === r.horseId);
              const j = jockeys.find(x => x.id === r.jockeyId);
              return (
                <tr key={r.regId} className="border-t border-border/60">
                  <td className="px-4 py-3">{r.lane}</td>
                  <td className="font-medium">{h?.name}</td>
                  <td className="text-muted-foreground">{j?.name}</td>
                  <td>
                    <input
                      type="number" step="0.01" disabled={submitted}
                      value={r.finishTime || ""} onChange={(e) => update(r.regId, { finishTime: parseFloat(e.target.value) || 0 })}
                      className="w-24 rounded-md border border-input bg-background px-2 py-1 font-mono text-sm"
                    />
                  </td>
                  <td className="font-mono text-xs">{r.score ? r.score.toFixed(2) : "—"}</td>
                  <td className="font-display text-lg text-primary">{r.rank || "—"}</td>
                  <td>
                    <input type="checkbox" disabled={submitted} checked={r.violation} onChange={(e) => update(r.regId, { violation: e.target.checked })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={simulate} disabled={submitted} className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary/40 disabled:opacity-40">Simulate live finish</button>
        <button onClick={submit} disabled={submitted || ranked.some(r => !r.finishTime)} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
          {submitted ? "Report submitted" : "Submit official report"}
        </button>
      </div>
    </div>
  );
}
