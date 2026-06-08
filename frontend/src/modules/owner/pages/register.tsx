import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/modules/core/components/app-shell";
import { WarningPanel } from "@/modules/core/components/warning-panel";
import { useRole } from "@/modules/core/lib/role-context";
import { horses, jockeys, races, registrations } from "@/modules/core/lib/mock-data";
import { validateRegistration } from "@/modules/core/lib/calculations";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { activeId } = useRole();
  const myHorses = horses.filter(h => h.ownerId === activeId);
  const openRaces = races.filter(r => ["Scheduled","RegistrationOpen","RegistrationClosed"].includes(r.status));

  const [horseId, setHorseId] = useState(myHorses[0]?.id ?? "");
  const [raceId, setRaceId] = useState(openRaces[0]?.id ?? "");
  const [jockeyId, setJockeyId] = useState(jockeys[0].id);

  const issues = useMemo(() => {
    const h = horses.find(x => x.id === horseId);
    const j = jockeys.find(x => x.id === jockeyId);
    const r = races.find(x => x.id === raceId);
    if (!h || !j || !r) return [];
    return validateRegistration(h, j, r, registrations);
  }, [horseId, raceId, jockeyId]);

  const hasErrors = issues.some(i => i.kind === "error");

  return (
    <div>
      <PageHeader title="Register a Horse" subtitle="Choose race, horse, and jockey — eligibility validated live" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={(e) => { e.preventDefault(); if (hasErrors) return; toast.success("Registration submitted · invitation sent to jockey"); }}
          className="space-y-4 rounded-2xl border bg-card p-6"
        >
          <Field label="Race">
            <select value={raceId} onChange={(e) => setRaceId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {openRaces.map(r => <option key={r.id} value={r.id}>{r.category} · {r.raceClass} · {new Date(r.dateTime).toLocaleString()}</option>)}
            </select>
          </Field>
          <Field label="Horse">
            <select value={horseId} onChange={(e) => setHorseId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {myHorses.map(h => <option key={h.id} value={h.id}>{h.name} · {h.weight}kg</option>)}
            </select>
          </Field>
          <Field label="Invite jockey">
            <select value={jockeyId} onChange={(e) => setJockeyId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {jockeys.map(j => <option key={j.id} value={j.id}>{j.name} · Ranking #{j.ranking}</option>)}
            </select>
          </Field>
          <button disabled={hasErrors} className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground disabled:opacity-40">
            {hasErrors ? "Resolve issues to submit" : "Submit registration"}
          </button>
        </form>

        <div className="space-y-3">
          {issues.length === 0 ? (
            <WarningPanel variant="info" title="All eligibility checks passed" items={["Horse certificate valid","Weight within class limit","Jockey workload OK","Within 48h registration window"]} />
          ) : (
            <>
              {issues.filter(i => i.kind === "error").length > 0 && (
                <WarningPanel variant="destructive" title="Blocking issues" items={issues.filter(i => i.kind === "error").map(i => i.message)} />
              )}
              {issues.filter(i => i.kind === "warning").length > 0 && (
                <WarningPanel variant="warning" title="Warnings" items={issues.filter(i => i.kind === "warning").map(i => i.message)} />
              )}
            </>
          )}
          <div className="rounded-2xl border bg-card p-4 text-sm">
            <div className="mb-2 font-display text-base">Business rules</div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>BR-01 · Valid health certificate + eligible weight</li>
              <li>BR-02 · Max 3 rides per jockey per day</li>
              <li>BR-04 · Registration closes 48h before race</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
