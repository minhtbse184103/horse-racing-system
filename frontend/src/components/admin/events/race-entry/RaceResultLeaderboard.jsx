import { Crown, Trophy, X } from 'lucide-react';
import { formatVndCurrency } from '../../../../lib/eventFormatters';
import { useLanguage } from '../../../../context/LanguageContext';

const DISTRIBUTION_STATUS_STYLES = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  FAILED: 'border-red-200 bg-red-50 text-red-700',
  NO_PRIZE: 'border-stone-200 bg-stone-100 text-stone-700'
};

function formatDistributionStatus(status) {
  const normalized = String(status || 'NO_PRIZE').toUpperCase();
  const labels = {
    PENDING: 'Pending',
    PAID: 'Paid',
    FAILED: 'Failed',
    NO_PRIZE: 'No Prize'
  };
  return labels[normalized] || String(status || 'No Prize').replace(/_/g, ' ');
}

function rankTone(position) {
  if (Number(position) === 1) {
    return {
      rank: 'bg-gold-400 text-brown-900',
      bar: 'from-red-700 to-red-600 text-white',
      stripe: 'bg-gold-300',
      shadow: 'shadow-[0_18px_40px_rgba(185,28,28,0.18)]'
    };
  }
  if (Number(position) === 2) {
    return {
      rank: 'bg-gold-300 text-brown-900',
      bar: 'from-emerald-700 to-emerald-500 text-white',
      stripe: 'bg-emerald-200',
      shadow: 'shadow-[0_18px_40px_rgba(4,120,87,0.16)]'
    };
  }
  if (Number(position) === 3) {
    return {
      rank: 'bg-gold-200 text-brown-900',
      bar: 'from-orange-700 to-orange-500 text-white',
      stripe: 'bg-orange-200',
      shadow: 'shadow-[0_18px_40px_rgba(194,65,12,0.14)]'
    };
  }
  if (Number(position) === 4) {
    return {
      rank: 'bg-brown-700 text-white',
      bar: 'from-sky-700 to-blue-600 text-white',
      stripe: 'bg-sky-200',
      shadow: 'shadow-[0_14px_32px_rgba(2,132,199,0.12)]'
    };
  }
  if (Number(position) === 5) {
    return {
      rank: 'bg-brown-700 text-white',
      bar: 'from-fuchsia-700 to-pink-600 text-white',
      stripe: 'bg-pink-200',
      shadow: 'shadow-[0_14px_32px_rgba(192,38,211,0.12)]'
    };
  }
  return {
    rank: 'bg-brown-700 text-white',
    bar: 'from-stone-700 to-brown-600 text-white',
    stripe: 'bg-stone-200',
    shadow: 'shadow-[0_14px_32px_rgba(78,44,25,0.12)]'
  };
}

export default function RaceResultLeaderboard({
  race,
  results,
  totalPrize,
  onClose,
  showCloseButton = true,
  onMarkOwnerPayoutPaid,
  canMarkOwnerPayoutPaid,
  markingPrizeDistributionId,
  markOwnerPayoutLabel = 'Mark owner payout paid',
  ownerPayoutUnavailableLabel = 'Only your payout can be marked'
}) {
  const { t } = useLanguage();

  return (
    <div className="max-h-[82vh] overflow-hidden rounded-lg border border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,237,0.98),rgba(246,229,204,0.94))] shadow-[0_18px_46px_rgba(43,23,16,0.18)]">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,237,0.98),rgba(246,229,204,0.96))] p-4">
        <div>
          <p className="inline-flex rounded-sm bg-blue-700 px-1.5 py-0.5 text-xs font-black uppercase tracking-[0.18em] text-white">{t('eventResultPrizeOfficialOrder')}</p>
          <h4 id="race-result-prize-title" className="mt-1 text-xl font-black text-brown-950">{race.name}</h4>
          <p className="mt-1 text-xs font-bold text-slate-600">
            {t('eventResultPrizeTotalRecorded')}: {formatVndCurrency(totalPrize)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="hidden shrink-0 text-gold-300 opacity-100 drop-shadow-[0_2px_8px_rgba(234,179,8,0.35)] sm:block" size={24} />
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white/90 text-brown-800 shadow-sm transition hover:bg-cream-200"
              aria-label={t('eventCommonClose')}
            >
              <X size={17} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="max-h-[calc(82vh-6.75rem)] space-y-3 overflow-y-auto px-4 pb-4 pr-2 pt-4 [scrollbar-color:#8b5a35_rgba(255,248,237,0.75)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-cream-200/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brown-500/70 [&::-webkit-scrollbar-thumb:hover]:bg-brown-600">
        {/* FLOW: Official Result Display */}
        {/* ORDER: 7/7 - Render official finish order and the prize split fields returned by the backend. */}
        {/* FLOW: Prize Split Display
           ORDER: 7B/7 - Row cells display ownerAmount, jockeyAmount, and distributionStatus from PrizeDistribution.
           Shows official prize money plus owner/jockey split amounts calculated during Admin approval. */}
        {results.map((result) => {
          const distributionStatus = String(result.distributionStatus || 'NO_PRIZE').toUpperCase();
          const tone = rankTone(result.finishPosition);
          const canMarkPayout = typeof canMarkOwnerPayoutPaid === 'function'
            ? canMarkOwnerPayoutPaid(result)
            : true;

          return (
            <article key={result.resultId} className={`group overflow-hidden rounded-lg bg-white/95 transition hover:-translate-y-0.5 ${tone.shadow}`}>
              <div className="grid min-h-[9rem] grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[5.75rem_minmax(0,1fr)_20.5rem]">
                <div className={`relative grid place-items-center ${tone.rank}`}>
                  <span className={`absolute bottom-0 left-0 h-1.5 w-full ${tone.stripe}`} />
                  {Number(result.finishPosition) === 1 ? (
                    <div className="grid place-items-center gap-1">
                      <Crown size={22} />
                      <span className="text-lg font-black">1</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-black">{result.finishPosition}</span>
                  )}
                </div>

                <div className={`relative overflow-hidden bg-gradient-to-r ${tone.bar}`}>
                  <div className="pointer-events-none absolute inset-y-0 right-4 hidden w-24 skew-x-[-16deg] bg-white/14 lg:block" />
                  <div className="relative grid h-full min-w-0 content-between gap-4 p-4">
                    <div className="flex min-w-0 flex-wrap items-stretch gap-2">
                      <div className="min-w-[13rem] max-w-full bg-black px-3 py-2 text-sm font-black uppercase tracking-wide text-white shadow-[8px_0_0_rgba(255,255,255,0.95)] sm:min-w-[15rem]">
                        <span className="block truncate">{result.horseName || 'N/A'}</span>
                      </div>
                      <div className="inline-flex min-h-9 items-stretch overflow-hidden bg-black text-xs font-black uppercase text-white shadow-[8px_0_0_rgba(255,255,255,0.95)]">
                        <span className="flex items-center bg-white px-3 text-brown-900">{t('eventCommonStall')}</span>
                        <span className="flex min-w-10 items-center justify-center px-3 text-center">{result.startingStall || '-'}</span>
                      </div>
                      <div className="inline-flex min-h-9 items-stretch overflow-hidden bg-black text-xs font-black uppercase text-white">
                        <span className="flex items-center bg-white px-3 text-brown-900">{t('eventResultPrizeTime')}</span>
                        <span className="flex min-w-16 items-center justify-center px-3 text-center font-mono">{result.finishTime || '-'}</span>
                      </div>
                    </div>
                    <div className="grid gap-3 text-lg font-black sm:grid-cols-2">
                      <div className="min-w-0 rounded-md border border-black/15 bg-white px-4 py-3 text-brown-950 shadow-sm">
                        <span className="mr-2 text-black">{t('eventDomainOwner')}:</span>
                        <span className="break-words text-black">{result.ownerName || 'N/A'}</span>
                      </div>
                      <div className="min-w-0 rounded-md border border-black/15 bg-white px-4 py-3 text-brown-950 shadow-sm">
                        <span className="mr-2 text-black">{t('eventDomainJockey')}:</span>
                        <span className="break-words text-black">{result.jockeyName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 border-l border-brown-700/10 bg-white px-5 py-4">
                  <div className="w-full">
                    <p className="text-[0.65rem] font-black uppercase text-slate-500">{t('eventResultPrizePrizeMoney')}</p>
                    <p className="mt-1 text-2xl font-black text-brown-900">{formatVndCurrency(result.prizeMoney || 0)}</p>
                  </div>
                  <div className="grid w-full gap-2 text-xs sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                    <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-2 font-black text-emerald-700">
                      <span className="block text-[0.62rem] uppercase text-emerald-900/55">{t('eventDomainOwner')}</span>
                      {formatVndCurrency(result.ownerAmount || 0)}
                    </span>
                    <span className="rounded-md border border-sky-100 bg-sky-50 px-2.5 py-2 font-black text-sky-700">
                      <span className="block text-[0.62rem] uppercase text-sky-900/55">{t('eventDomainJockey')}</span>
                      {formatVndCurrency(result.jockeyAmount || 0)}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-[0.68rem] font-black uppercase ${DISTRIBUTION_STATUS_STYLES[distributionStatus] || DISTRIBUTION_STATUS_STYLES.NO_PRIZE}`}>
                    <span className="opacity-70">{t('eventResultPrizePayoutStatus')}</span>
                    <span>{formatDistributionStatus(distributionStatus)}</span>
                  </div>
                  {typeof onMarkOwnerPayoutPaid === 'function'
                    && result.prizeDistributionId
                    && distributionStatus === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => onMarkOwnerPayoutPaid(result)}
                      disabled={!canMarkPayout || markingPrizeDistributionId === result.prizeDistributionId}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {markingPrizeDistributionId === result.prizeDistributionId
                        ? `${t('loading')}...`
                        : canMarkPayout ? markOwnerPayoutLabel : ownerPayoutUnavailableLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
