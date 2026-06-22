import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { WIZARD_STEPS } from './wizardConstants';

export default function WizardStepper({ step }) {
  return (
    <div className="shrink-0 border-b border-brown-700/10 bg-cream-200/55 px-4 py-2.5 md:px-6 md:py-3">
      <ol className="grid grid-cols-4 gap-1 sm:gap-2">
        {WIZARD_STEPS.map((item) => {
          const Icon = item.icon;
          const complete = item.id < step;
          const active = item.id === step;

          return (
            <li key={item.id} className="relative min-w-0">
              {item.id > 1 && (
                <motion.span
                  initial={false}
                  animate={{ scaleX: item.id <= step ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute right-1/2 top-5 hidden h-px w-full origin-right sm:block ${item.id <= step ? 'bg-emerald-600' : 'bg-brown-700/15'}`}
                />
              )}
              <div className="relative z-10 flex flex-col items-center text-center sm:flex-row sm:text-left">
                <motion.span
                  animate={{ scale: active ? 1.06 : 1 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                  className={`grid size-8 shrink-0 place-items-center rounded-full border shadow-sm ${complete ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-brown-700 bg-brown-700 text-white ring-4 ring-gold-400/20' : 'border-brown-700/15 bg-white text-slate-500'}`}
                >
                  {complete ? <Check size={16} /> : <Icon size={16} />}
                </motion.span>
                <span className="mt-1.5 min-w-0 sm:ml-2.5 sm:mt-0">
                  <strong className={`block truncate text-[11px] font-black sm:text-sm ${active ? 'text-brown-900' : complete ? 'text-emerald-800' : 'text-slate-500'}`}>
                    {item.label}
                  </strong>
                  <small className="hidden text-xs font-semibold text-slate-500 lg:block">{item.shortLabel}</small>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
