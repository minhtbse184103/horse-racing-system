import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/modules/core/components/app-shell";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";
import { WarningPanel } from "@/modules/core/components/warning-panel";
import { useRole } from "@/modules/core/lib/role-context";
import { horses } from "@/modules/core/lib/mock-data";

export const Route = createFileRoute("/owner/horses")({
  component: HorsesPage,
});

function HorsesPage() {
  const { activeId } = useRole();
  const my = horses.filter(h => h.ownerId === activeId);
  return (
    <div>
      <PageHeader title="My Horses" subtitle="Manage certificates, weights, and performance"
        actions={<button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">+ Add horse</button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {my.map(h => {
          const expired = new Date(h.certExpiry) < new Date();
          return (
            <article key={h.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl">{h.name}</h2>
                  <p className="text-xs text-muted-foreground">{h.breed} · {h.age} years · {h.weight}kg</p>
                </div>
                <StatusBadge variant={statusVariant(h.status)}>{h.status}</StatusBadge>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                <Stat label="Speed" value={h.speedRating} />
                <Stat label="Stamina" value={h.stamina} />
                <Stat label="Wins" value={h.wins} />
                <Stat label="Top 3" value={h.top3Finishes} />
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Best finish: <span className="font-mono text-foreground">{h.bestFinishTime}s</span>
              </div>
              {expired ? (
                <div className="mt-3"><WarningPanel variant="destructive" title="Health certificate expired" items={[`Expired on ${h.certExpiry}`]} /></div>
              ) : (
                <div className="mt-3 text-xs text-muted-foreground">Certificate valid until {h.certExpiry}</div>
              )}
              {h.injuryHistory.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">Injury history: {h.injuryHistory.join(", ")}</div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-display text-lg">{value}</div>
    </div>
  );
}
