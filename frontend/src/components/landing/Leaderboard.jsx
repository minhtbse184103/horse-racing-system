import { Crown, Medal, Trophy } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

function buildRanking(results, type) {
  const isHorse = type === "horse";
  const ranking = new Map();

  results.forEach((result) => {
    const id = isHorse ? result.horseId : result.jockeyId;
    const name = isHorse ? result.horseName : result.jockeyName;
    if (id == null || !name) return;

    const key = String(id);
    const current = ranking.get(key) || { id: key, name, wins: 0, topThree: 0, races: 0, prize: 0 };
    const position = Number(result.finishPosition);
    current.races += 1;
    if (position === 1) current.wins += 1;
    if (position >= 1 && position <= 3) current.topThree += 1;
    current.prize += Number(isHorse ? result.totalPrize ?? result.prizeMoney : result.jockeyAmount ?? 0) || 0;
    ranking.set(key, current);
  });

  return [...ranking.values()]
    .sort((a, b) => b.wins - a.wins || b.topThree - a.topThree || b.prize - a.prize || a.name.localeCompare(b.name))
    .slice(0, 3);
}

function Ranking({ title, icon: Icon, entries, t }) {
  return (
    <div className="overflow-hidden rounded-xl border border-brown-900/10 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-brown-900/10 bg-brown-900 px-5 py-4 text-cream-100">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-gold-400 text-brown-900"><Icon className="h-5 w-5" aria-hidden /></span>
        <h3 className="font-extrabold">{title}</h3>
      </div>
      {entries.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-brown-900/60">{t('homeNoRanking')}</p>
      ) : (
        <ol className="divide-y divide-brown-900/10">
          {entries.map((entry, index) => (
            <li key={entry.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-5 py-4">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold ${index === 0 ? "bg-gold-400 text-brown-900" : "bg-cream-200 text-brown-500"}`}>{index + 1}</span>
              <p className="min-w-0 truncate font-bold text-brown-900">{entry.name}</p>
              <p className="text-right font-extrabold text-brown-900">{t('homeWins', { count: entry.wins })}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function Leaderboard({ results, isLoading }) {
  const { t } = useLanguage();
  const horses = buildRanking(results, "horse");
  const jockeys = buildRanking(results, "jockey");

  return (
    <section id="leaderboard" className="bg-cream-200 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">{t('homeOfficialPerformance')}</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-brown-900 sm:text-3xl">{t('homeLeaderboard')}</h2><p className="mt-2 max-w-2xl text-sm text-brown-900/65">{t('homeLeaderboardHint')}</p></div>
          <Trophy className="hidden h-12 w-12 text-gold-400 sm:block" aria-hidden />
        </div>
        {isLoading ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-xl bg-white" /><div className="h-80 animate-pulse rounded-xl bg-white" /></div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Ranking title={t('homeTopHorses')} icon={Crown} entries={horses} t={t} />
            <Ranking title={t('homeTopJockeys')} icon={Medal} entries={jockeys} t={t} />
          </div>
        )}
      </div>
    </section>
  );
}
