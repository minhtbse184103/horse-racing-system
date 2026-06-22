import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { fadeSlideItem, hoverLift } from '../../ui/motion';

export function WizardField({ label, hint, error, children, className = '' }) {
  return (
    <label className={`grid content-start gap-1.5 text-sm font-extrabold text-brown-900 ${className}`}>
      <span>{label}</span>
      {children}
      {hint && !error && <span className="text-xs font-semibold leading-5 text-slate-500">{hint}</span>}
      {error && (
        <span className="flex items-start gap-1.5 text-xs font-bold leading-5 text-danger">
          <AlertCircle className="mt-0.5 shrink-0" size={13} /> {error}
        </span>
      )}
    </label>
  );
}

export function WizardSectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase text-brown-500">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-black text-brown-900 md:text-2xl">{title}</h3>
        <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function WizardValidationBanner({ message }) {
  if (!message) return null;

  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-danger-bg px-4 py-3 text-sm font-bold text-danger">
      <AlertCircle className="mt-0.5 shrink-0" size={17} />
      <span>{message}</span>
    </div>
  );
}

export function WizardSummaryItem({ icon: Icon, label, value }) {
  return (
    <motion.div
      variants={fadeSlideItem}
      whileHover={hoverLift}
      className="flex min-w-0 gap-3 rounded-lg border border-white/80 bg-white/85 p-4 shadow-[0_8px_24px_rgba(78,44,25,0.08)]"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-cream-200 text-brown-700">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-black leading-5 text-brown-900">{value}</p>
      </div>
    </motion.div>
  );
}
