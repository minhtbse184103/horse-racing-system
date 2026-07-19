import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, LoaderCircle, RefreshCw, Trophy } from 'lucide-react';
import { getRaceResults } from '../../../../services/eventService';
import { useLanguage } from '../../../../context/LanguageContext';
import RaceResultLeaderboard from './RaceResultLeaderboard';

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
        className="w-full max-w-7xl overflow-visible bg-transparent shadow-none"
      >
        <div>
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
            <RaceResultLeaderboard race={race} results={results} totalPrize={totalPrize} onClose={onClose} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
