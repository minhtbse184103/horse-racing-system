import { motion } from 'framer-motion';
import { getCapacityTone } from './tournamentWorkspaceUtils';

export default function RegistrationCapacity({ value, max, showLabel = false }) {
  const percentage = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));

  return (
    <div className="w-full min-w-0">
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="text-base font-black text-brown-900">{value}</span>
          <span className="text-xs font-bold text-slate-500"> / {max}</span>
        </div>
        <span className="text-xs font-extrabold text-slate-500">{percentage}%</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-brown-700/10"
        role="progressbar"
        aria-label="Registration capacity"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax={max}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full transition-all ${getCapacityTone(percentage)}`}
        />
      </div>
      {showLabel && (
        <p className="mt-1.5 text-xs font-semibold text-slate-500">
          {percentage >= 100 ? 'Registration capacity reached' : `${max - value} places available`}
        </p>
      )}
    </div>
  );
}
