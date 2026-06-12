import { CalendarDays, MapPin, Users, Scale } from "lucide-react";
import StatusBadge from "./StatusBadge";

const fmt = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function TournamentPreview({ tournament }) {
  const {
    tournamentName,
    location,
    startDate,
    endDate,
    conditionName,
    minParticipants,
    maxParticipants,
    status
  } = tournament;

  return (
    <article className="group flex flex-col rounded-lg border border-brown-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-brown-900 leading-snug">{tournamentName}</h3>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-5 space-y-3 text-sm text-brown-900/80">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-brown-500 shrink-0" aria-hidden />
          <dt className="sr-only">Địa điểm</dt>
          <dd>{location}</dd>
        </div>
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-4 w-4 text-brown-500 shrink-0" aria-hidden />
          <dt className="sr-only">Ngày thi đấu</dt>
          <dd>{fmt(startDate)} — {fmt(endDate)}</dd>
        </div>
        <div className="flex items-center gap-2.5">
          <Scale className="h-4 w-4 text-brown-500 shrink-0" aria-hidden />
          <dt className="sr-only">Điều kiện</dt>
          <dd>{conditionName}</dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-brown-900/10 pt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-brown-900/70">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Participants
          </span>
          <span>{minParticipants} - {maxParticipants}</span>
        </div>
        <p className="mt-2 text-xs text-brown-900/55">
          Tournament participant capacity
        </p>
      </div>
    </article>
  );
}
