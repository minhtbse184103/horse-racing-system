import { motion } from 'framer-motion';
import { Medal, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_ADDITIONAL_PRIZE, FIELD_CLASS } from './wizardConstants';
import { WizardValidationBanner } from './WizardPrimitives';

export default function PrizeEditorCard({ race, index, error, onChange }) {
  const total = race.prizes.reduce((sum, prize) => sum + Number(prize.amount || 0), 0);

  function updatePrize(rankIndex, patch) {
    const prizes = race.prizes.map((prize, itemIndex) => (
      itemIndex === rankIndex ? { ...prize, ...patch } : prize
    ));
    onChange(prizes);
  }

  return (
    <motion.article layout className="overflow-hidden rounded-lg border border-white/80 bg-white/90 shadow-[0_10px_28px_rgba(78,44,25,0.08)] transition-shadow hover:shadow-[0_16px_36px_rgba(78,44,25,0.12)]">
      <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/45 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold-400 text-xs font-black text-brown-900">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-brown-900">{race.name}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{race.prizes.length} hạng giải thưởng</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-extrabold uppercase text-slate-500">Tổng giải thưởng</p>
          <p className="font-black text-brown-900">THB {total.toLocaleString()}</p>
        </div>
      </div>

      <div className="p-4">
        {error && <WizardValidationBanner message={error} />}
        <div className="grid gap-2">
          {race.prizes.map((prize, rankIndex) => (
            <div key={`${race.id}-rank-${rankIndex}`} className="grid gap-3 rounded-lg border border-brown-700/10 bg-cream-100 px-3 py-3 sm:grid-cols-[3.25rem_minmax(0,1fr)_6.5rem_6.5rem_2.5rem] sm:items-end">
              <span className={`grid size-9 place-items-center rounded-lg text-xs font-black ${rankIndex === 0 ? 'bg-gold-400 text-brown-900' : 'bg-cream-200 text-brown-700'}`}>#{rankIndex + 1}</span>
              <label className="relative block">
                <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Giá trị giải thưởng</span>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">THB</span>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  className={`${FIELD_CLASS} pl-12`}
                  value={prize.amount}
                  onChange={(event) => updatePrize(rankIndex, { amount: Number(event.target.value) })}
                  aria-label={`Giá trị giải thưởng cho hạng ${rankIndex + 1}`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Tỷ lệ Owner</span>
                <input type="number" min="0" max="100" step="0.01" className={FIELD_CLASS} value={prize.ownerPercent} onChange={(event) => updatePrize(rankIndex, { ownerPercent: Number(event.target.value) })} aria-label={`Tỷ lệ Owner cho hạng ${rankIndex + 1}`} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Tỷ lệ Jockey</span>
                <input type="number" min="0" max="100" step="0.01" className={FIELD_CLASS} value={prize.jockeyPercent} onChange={(event) => updatePrize(rankIndex, { jockeyPercent: Number(event.target.value) })} aria-label={`Tỷ lệ Jockey cho hạng ${rankIndex + 1}`} />
              </label>
              <button type="button" onClick={() => onChange(race.prizes.filter((_, itemIndex) => itemIndex !== rankIndex))} className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-danger" aria-label={`Xóa giải thưởng hạng ${rankIndex + 1}`}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {race.prizes.length === 0 && (
          <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-brown-700/20 bg-cream-200/25 p-5 text-center">
            <div><Medal className="mx-auto text-brown-500" size={21} /><p className="mt-2 text-sm font-black text-brown-900">Chưa cấu hình hạng giải thưởng</p><p className="mt-1 text-xs font-semibold text-slate-500">Thêm hạng 1 để bắt đầu cơ cấu giải thưởng của Race này.</p></div>
          </div>
        )}

        <button type="button" onClick={() => onChange([...race.prizes, { ...DEFAULT_ADDITIONAL_PRIZE }])} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 text-sm font-extrabold text-brown-700 transition hover:border-brown-500 hover:bg-cream-200">
          <Plus size={15} /> Thêm hạng {race.prizes.length + 1}
        </button>
      </div>
    </motion.article>
  );
}
