import { motion } from 'framer-motion';
import { tournamentStatusLabels } from '../../../lib/eventFormatters';

const statusClasses = {
  OPEN_FOR_REGISTRATION:
    'border-emerald-200 bg-emerald-50 text-emerald-900 before:bg-emerald-500',
  REGISTRATION_CLOSED:
    'border-stone-200 bg-stone-100 text-stone-800 before:bg-stone-500',
  READY: 'border-amber-200 bg-amber-50 text-amber-900 before:bg-amber-500',
  IN_PROGRESS: 'border-sky-200 bg-sky-50 text-sky-900 before:bg-sky-500',
  PENDING_REVIEW:
    'border-violet-200 bg-violet-50 text-violet-900 before:bg-violet-500',
  COMPLETED: 'border-green-200 bg-green-50 text-green-900 before:bg-green-600',
  CANCELLED: 'border-red-200 bg-red-50 text-red-800 before:bg-red-500'
};

export default function TournamentStatusBadge({ status }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.7rem] font-black uppercase shadow-[0_4px_12px_rgba(43,23,16,0.07)] before:size-1.5 before:shrink-0 before:rounded-full before:shadow-[0_0_0_3px_rgba(255,255,255,0.7)] ${
        statusClasses[status] ||
        'border-brown-700/10 bg-cream-200 text-brown-700 before:bg-brown-500'
      }`}
      aria-label={`Status Tournament: ${tournamentStatusLabels[status] || status}`}
    >
      {tournamentStatusLabels[status] || status}
    </motion.span>
  );
}
