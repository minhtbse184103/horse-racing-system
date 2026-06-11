import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/modules/core/components/app-shell";
import { useRole } from "@/modules/core/lib/role-context";
import { registrations as initial, horses, races } from "@/modules/core/lib/mock-data";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";
import { toast } from "sonner";

export const Route = createFileRoute("/jockey/invitations")({
  component: InvitationsPage,
});

function InvitationsPage() {
  const { activeId } = useRole();
  const [regs, setRegs] = useState(initial);

  const mine = regs.filter(r => r.jockeyId === activeId);
  const respond = (id: string, status: "Accepted" | "Rejected") => {
    setRegs(rs => rs.map(r => r.id === id ? { ...r, invitationStatus: status } : r));
    toast.success(`Invitation ${status.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader title="Invitations" subtitle="Review horse details before accepting" />
      <div className="space-y-3">
        {mine.map(r => {
          const horse = horses.find(h => h.id === r.horseId);
          const race = races.find(x => x.id === r.raceId);
          return (
            <article key={r.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl">{horse?.name} <span className="text-muted-foreground">·</span> {race?.category}</div>
                  <div className="text-xs text-muted-foreground">{race && new Date(race.dateTime).toLocaleString()} · {race?.track} · Lane {r.lane}</div>
                </div>
                <StatusBadge variant={statusVariant(r.invitationStatus)}>{r.invitationStatus}</StatusBadge>
              </div>
              {horse && (
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 md:grid-cols-4">
                  <Info label="Breed" value={horse.breed} />
                  <Info label="Weight" value={`${horse.weight}kg`} />
                  <Info label="Age" value={`${horse.age}yo`} />
                  <Info label="Best time" value={`${horse.bestFinishTime}s`} />
                  <Info label="Wins" value={`${horse.wins}`} />
                  <Info label="Top 3" value={`${horse.top3Finishes}`} />
                  <Info label="Speed" value={`${horse.speedRating}`} />
                  <Info label="Stamina" value={`${horse.stamina}`} />
                </div>
              )}
              {horse?.injuryHistory.length ? (
                <div className="mt-3 text-xs text-warning">⚠ Injury history: {horse.injuryHistory.join(", ")}</div>
              ) : null}
              {r.invitationStatus === "Pending" && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => respond(r.id, "Accepted")} className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground">Accept</button>
                  <button onClick={() => respond(r.id, "Rejected")} className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">Reject</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
