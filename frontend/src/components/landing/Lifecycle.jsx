import { ChevronRight, XCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";

const LIFECYCLE_STAGES = [
  { key: "draft", description: "Admins prepare schedule, rules and weight classes." },
  { key: "openforregistration", description: "Owners enter horses and invite jockeys." },
  { key: "closedregistration", description: "Entries locked, admin reviews the field." },
  { key: "ongoing", description: "Races run and referees record outcomes." },
  { key: "finished", description: "Official results, standings and prizes published." },
];

export default function Lifecycle() {
  return (
    <section className="bg-cream-200 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">Tournament Lifecycle</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brown-900 sm:text-4xl">From draft to finish line</h2>
          <p className="mt-3 text-base text-brown-900/70">Every tournament progresses through clear, auditable stages.</p>
        </div>

        <div className="mt-10 flex flex-wrap items-stretch gap-3">
          {LIFECYCLE_STAGES.map((s, i) => (
            <div key={s.key} className="flex items-stretch gap-3">
              <div className="flex w-64 flex-col rounded-lg border border-brown-900/10 bg-white p-4 shadow-sm">
                <StatusBadge status={s.key} />
                <p className="mt-3 text-sm leading-relaxed text-brown-900/75">{s.description}</p>
              </div>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <div className="hidden items-center text-brown-900/30 sm:flex" aria-hidden>
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 inline-flex items-center gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          <XCircle className="h-4 w-4" aria-hidden />
          <span><strong className="font-bold">Cancelled</strong> — alternate terminal state if a tournament cannot run.</span>
        </div>
      </div>
    </section>
  );
}
