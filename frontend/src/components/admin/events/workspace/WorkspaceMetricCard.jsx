import { motion } from 'framer-motion';
import { fadeSlideItem, hoverLift } from '../../ui/motion';

export default function WorkspaceMetricCard({ icon: Icon, label, value, hint, tone = 'brown' }) {
  const tones = {
    brown: 'bg-brown-900 text-white shadow-brown-900/20',
    gold: 'bg-gold-400 text-brown-900 shadow-gold-400/20',
    green: 'bg-emerald-700 text-white shadow-emerald-700/20',
    cream: 'bg-cream-200 text-brown-700 shadow-brown-700/10'
  };

  return (
    <motion.article
      variants={fadeSlideItem}
      whileHover={hoverLift}
      className="group relative overflow-hidden rounded-lg border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,248,238,0.9))] p-4 shadow-[0_10px_30px_rgba(78,44,25,0.08),0_1px_2px_rgba(43,23,16,0.07)] transition-colors hover:border-gold-400/40 hover:shadow-[0_18px_42px_rgba(78,44,25,0.13)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none text-brown-900">{value}</p>
        </div>
        <div className={`grid size-11 shrink-0 place-items-center rounded-lg shadow-lg ${tones[tone]}`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
      </div>
      <p className="mt-3 border-t border-brown-700/10 pt-2.5 text-xs font-semibold text-slate-500">
        {hint}
      </p>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold-400 transition-transform duration-300 group-hover:scale-x-100" />
    </motion.article>
  );
}
