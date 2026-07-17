import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, LoaderCircle, Medal, RefreshCw, Trophy, X } from 'lucide-react';
import { getRaceResults } from '../../../../services/eventService';
import { formatVndCurrency } from '../../../../lib/eventFormatters';
import { useLanguage } from '../../../../context/LanguageContext';

const RESULT_GRID_COLUMNS =
  'grid-cols-[3.75rem_minmax(10rem,1.15fr)_minmax(7rem,0.75fr)_minmax(8rem,0.85fr)_5rem_6.75rem_6.75rem_6.75rem_6.5rem]';

const DISTRIBUTION_STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-800',
  PAID: 'bg-emerald-50 text-emerald-800',
  FAILED: 'bg-red-50 text-red-700',
  NO_PRIZE: 'bg-stone-100 text-stone-700'
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

export default function RaceResultPrizeDialog({ race, onClose }) {
  const { t } = useLanguage();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadResults() {
    // FLOW: Official Result Display
    // ORDER: 1B/7 - Dialog load starts the official RaceResult read for the selected completed Race.
    // FE path: Race result/prize dialog -> GET official RaceResult rows after Admin approval.
    setLoading(true);
    setError('');
    try {
      const response = await getRaceResults(race.id);
      setResults(Array.isArray(response) ? response : []);
    } catch (loadError) {
      setError(loadError.message || t('eventResultPrizeLoadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, [race.id]);

  // FLOW: Prize Split Display
  // ORDER: 7A/7 - Dialog totals PrizeDistribution-backed prize rows for the summary amount.
  // Totals the official result/prize rows that include PrizeDistribution owner and jockey split amounts.
  const totalPrize = results.reduce(
    (sum, result) => sum + Number(result.totalPrize || result.prizeMoney || 0),
    0
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-brown-900/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="race-result-prize-title"
    >
      <motion.div
        initial={{ y: 16, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-lg border border-white/80 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.34)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(247,234,216,0.56))] px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase text-brown-500">
              <Medal size={15} /> {t('eventResultPrizeTitle')}
            </p>
            <h3 id="race-result-prize-title" className="mt-1 text-xl font-black text-brown-900">
              {race.name}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {t('eventResultPrizeTotalRecorded')}: <span className="font-black text-brown-900">{formatVndCurrency(totalPrize)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200"
            aria-label={t('eventCommonClose')}
          >
            <X size={17} />
          </button>
        </header>

        <div className="max-h-[68vh] overflow-y-auto p-5">
          {loading ? (
            <div className="grid min-h-56 place-items-center rounded-lg border border-brown-700/10 bg-white/70 text-center">
              <div>
                <LoaderCircle className="mx-auto animate-spin text-brown-500" size={25} />
                <p className="mt-3 text-sm font-black text-brown-900">{t('eventResultPrizeLoading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="grid min-h-56 place-items-center rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <div>
                <AlertTriangle className="mx-auto text-danger" size={24} />
                <p className="mt-3 font-black text-brown-900">{t('eventResultPrizeLoadError')}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{error}</p>
                <button type="button" onClick={loadResults} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brown-700 px-4 text-sm font-extrabold text-white">
                  <RefreshCw size={15} /> {t('eventCommonRetry')}
                </button>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-brown-700/20 bg-white/60 p-6 text-center">
              <div>
                <Trophy className="mx-auto text-brown-500" size={26} />
                <p className="mt-3 font-black text-brown-900">{t('eventResultPrizeEmptyTitle')}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {t('eventResultPrizeEmptyHint')}
                </p>
              </div>
            </div>
          ) : (
            // FLOW: Official Result Display
            // Renders only official approved RaceResult rows; provisional submissions are reviewed elsewhere.
            <div className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/85 shadow-[0_10px_28px_rgba(78,44,25,0.06)]">
              <div className={`grid ${RESULT_GRID_COLUMNS} gap-2 border-b border-brown-700/10 bg-cream-200/70 px-4 py-3 text-[0.68rem] font-black uppercase text-brown-700`}>
                <span>{t('eventCommonRank')}</span>
                <span>{t('eventDomainHorse')}</span>
                <span>{t('eventDomainOwner')}</span>
                <span>{t('eventDomainJockey')}</span>
                <span>{t('eventResultPrizeTime')}</span>
                <span>{t('eventResultPrizePrizeMoney')}</span>
                <span>{t('eventResultPrizeOwnerShare')}</span>
                <span>{t('eventResultPrizeJockeyShare')}</span>
                <span>{t('eventResultPrizePayoutStatus')}</span>
              </div>
              <div className="divide-y divide-brown-700/10">
                {/* FLOW: Official Result Display */}
                {/* ORDER: 7/7 - Render official finish order and the prize split fields returned by the backend. */}
                {/* FLOW: Prize Split Display
                   ORDER: 7B/7 - Row cells display ownerAmount, jockeyAmount, and distributionStatus from PrizeDistribution.
                   Shows official prize money plus owner/jockey split amounts calculated during Admin approval. */}
                {results.map((result) => {
                  const distributionStatus = String(result.distributionStatus || 'NO_PRIZE').toUpperCase();

                  return (
                  <article key={result.resultId} className={`grid ${RESULT_GRID_COLUMNS} items-center gap-2 px-4 py-3 text-sm`}>
                    <span className="inline-flex size-10 items-center justify-center rounded-lg bg-amber-50 text-sm font-black text-amber-800">
                      #{result.finishPosition}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-brown-900">{result.horseName || 'N/A'}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">{t('eventCommonStall')} {result.startingStall}</p>
                    </div>
                    <span className="truncate font-bold text-brown-900">{result.ownerName || 'N/A'}</span>
                    <span className="truncate font-bold text-brown-900">{result.jockeyName || 'N/A'}</span>
                    <span className="font-mono text-xs font-black text-slate-600">{result.finishTime || '-'}</span>
                    <span className="truncate font-black text-brown-900">{formatVndCurrency(result.prizeMoney || 0)}</span>
                    <span className="truncate font-bold text-emerald-700">{formatVndCurrency(result.ownerAmount || 0)}</span>
                    <span className="truncate font-bold text-sky-700">{formatVndCurrency(result.jockeyAmount || 0)}</span>
                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[0.68rem] font-black ${DISTRIBUTION_STATUS_STYLES[distributionStatus] || DISTRIBUTION_STATUS_STYLES.NO_PRIZE}`}>
                      {formatDistributionStatus(distributionStatus)}
                    </span>
                  </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
