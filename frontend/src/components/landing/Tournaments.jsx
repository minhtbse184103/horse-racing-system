import { useState } from "react";
import { ArrowRight } from "lucide-react";
import TournamentPreview from "./TournamentPreview";

export default function Tournaments({ tournaments, isLoading, error }) {
  const [showAll, setShowAll] = useState(false);
  const displayedTournaments = showAll ? tournaments : tournaments.slice(0, 3);

  return (
    <section id="tournaments" className="bg-cream-100 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">Tournament Discovery</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brown-900 sm:text-4xl">Upcoming Tournaments</h2>
            <p className="mt-3 text-base text-brown-900/70">
              A curated look at the racing calendar. Sign in to register a horse or accept a jockey invitation.
            </p>
          </div>
          {tournaments.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="inline-flex items-center gap-2 self-start rounded-md border border-brown-900/15 bg-white px-4 py-2.5 text-sm font-semibold text-brown-900 shadow-sm transition hover:bg-cream-200 sm:self-auto"
            >
              {showAll ? "Show Featured" : "View All Tournaments"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="mt-10 rounded-lg border border-brown-900/10 bg-white px-6 py-10 text-brown-900/65">
            Loading tournaments...
          </p>
        ) : error ? (
          <p className="mt-10 rounded-lg border border-danger/20 bg-danger/5 px-6 py-4 font-semibold text-danger">
            {error}
          </p>
        ) : displayedTournaments.length === 0 ? (
          <p className="mt-10 rounded-lg border border-brown-900/10 bg-white px-6 py-10 text-brown-900/65">
            No upcoming tournaments are available.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedTournaments.map((tournament) => (
              <TournamentPreview
                key={tournament.tournamentId}
                tournament={tournament}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
