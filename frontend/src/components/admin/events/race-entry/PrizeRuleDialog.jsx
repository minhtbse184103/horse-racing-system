import { motion } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { formatVndCurrency } from '../../../../lib/eventFormatters';
import { useLanguage } from '../../../../context/LanguageContext';

export default function PrizeRuleDialog({ race, onClose }) {
  const { t } = useLanguage();
  const totalPrize = race.prizes.reduce(
    (sum, prize) => sum + Number(prize.amount || 0),
    0
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-rule-title"
    >
      <motion.div
        initial={{ y: 16, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-lg border border-white/80 bg-cream-100 shadow-[0_28px_70px_rgba(43,23,16,0.28)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-white/75 px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase text-brown-500">
              <Trophy size={15} /> {t('eventPrizeRuleTitle')}
            </p>
            <h3 id="prize-rule-title" className="mt-1 text-xl font-black text-brown-900">
              {t('eventPrizeRuleOfRace', { raceName: race.name })}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {t('eventWizardTotalPrize')}: <span className="font-black text-brown-900">{formatVndCurrency(totalPrize)}</span>
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

        <div className="max-h-[62vh] overflow-y-auto p-5">
          {race.prizes.length > 0 ? (
            <div className="space-y-3">
              {race.prizes.map((prize, index) => {
                const amount = Number(prize.amount || 0);
                return (
                  <article
                    key={`${race.id}-prize-${index}`}
                    className="rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-[0_8px_22px_rgba(78,44,25,0.06)]"
                  >
                    <div>
                      <p className="text-xs font-black uppercase text-brown-500">{t('eventCommonRank')} {index + 1}</p>
                      <p className="mt-1 text-lg font-black text-brown-900">{formatVndCurrency(amount)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-brown-700/20 bg-white/60 p-6 text-center">
              <div>
                <Trophy className="mx-auto text-brown-500" size={25} />
                <p className="mt-3 font-black text-brown-900">{t('eventPrizeRuleNoPrizeTitle')}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {t('eventPrizeRuleNoPrizeHint')}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
