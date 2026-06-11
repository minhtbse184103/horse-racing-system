import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/modules/core/components/app-shell";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";
import { registrations as initial, races, horses, jockeys } from "@/modules/core/lib/mock-data";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/registrations")({
  component: RegistrationsPage,
});

function RegistrationsPage() {
  const [regs, setRegs] = useState(initial);

  const decide = (id: string, status: "Approved" | "Rejected") => {
    setRegs(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Registration ${status.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader title="Registrations" subtitle="Validate eligibility and approve race entries" />
      <div className="space-y-3">
        {regs.map(r => {
          const race = races.find(x => x.id === r.raceId);
          const horse = horses.find(x => x.id === r.horseId);
          const jockey = jockeys.find(x => x.id === r.jockeyId);
          const isPending = r.status === "Pending";
          return (
            <div key={r.id} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg">{horse?.name} <span className="text-muted-foreground">·</span> {jockey?.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {race?.category} {race?.raceClass} · {race && new Date(race.dateTime).toLocaleString()} · Lane {r.lane}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={statusVariant(r.status)}>{r.status}</StatusBadge>
                  <StatusBadge variant={statusVariant(r.invitationStatus)}>Invite: {r.invitationStatus}</StatusBadge>
                </div>
              </div>
              {r.warnings?.length ? (
                <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="font-semibold">Validation issues</div>
                  <ul className="mt-1 list-disc pl-5">{r.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              ) : null}
              {isPending && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => decide(r.id, "Approved")} className="inline-flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-sm font-medium text-success-foreground hover:opacity-90">
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => decide(r.id, "Rejected")} className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
