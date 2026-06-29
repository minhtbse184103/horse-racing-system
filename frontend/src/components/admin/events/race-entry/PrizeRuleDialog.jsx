import { motion } from 'framer-motion';
import { CircleDollarSign, Trophy, X } from 'lucide-react';
import { formatVndCurrency } from '../../../../lib/eventFormatters';

export default function PrizeRuleDialog({ race, onClose }) {
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
              <Trophy size={15} /> Cấu hình giải thưởng
            </p>
            <h3 id="prize-rule-title" className="mt-1 text-xl font-black text-brown-900">
              Prize rule của {race.name}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Tổng giải thưởng: <span className="font-black text-brown-900">{formatVndCurrency(totalPrize)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200"
            aria-label="Đóng"
          >
            <X size={17} />
          </button>
        </header>

        <div className="max-h-[62vh] overflow-y-auto p-5">
          {race.prizes.length > 0 ? (
            <div className="space-y-3">
              {race.prizes.map((prize, index) => {
                const amount = Number(prize.amount || 0);
                const ownerAmount = amount * Number(prize.ownerPercent || 0) / 100;
                const jockeyAmount = amount * Number(prize.jockeyPercent || 0) / 100;

                return (
                  <article
                    key={`${race.id}-prize-${index}`}
                    className="rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-[0_8px_22px_rgba(78,44,25,0.06)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase text-brown-500">Hạng {index + 1}</p>
                        <p className="mt-1 text-lg font-black text-brown-900">{formatVndCurrency(amount)}</p>
                      </div>
                      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700">
                        <CircleDollarSign size={14} /> Owner + Jockey = {Number(prize.ownerPercent || 0) + Number(prize.jockeyPercent || 0)}%
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
                        <p className="text-xs font-black uppercase text-emerald-700">Owner</p>
                        <p className="mt-1 text-sm font-black text-emerald-900">{prize.ownerPercent}% · {formatVndCurrency(ownerAmount)}</p>
                      </div>
                      <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-3">
                        <p className="text-xs font-black uppercase text-sky-700">Jockey</p>
                        <p className="mt-1 text-sm font-black text-sky-900">{prize.jockeyPercent}% · {formatVndCurrency(jockeyAmount)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-brown-700/20 bg-white/60 p-6 text-center">
              <div>
                <Trophy className="mx-auto text-brown-500" size={25} />
                <p className="mt-3 font-black text-brown-900">Race chưa có prize rule</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Chỉnh sửa Tournament để thêm cấu hình giải thưởng cho Race này.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
