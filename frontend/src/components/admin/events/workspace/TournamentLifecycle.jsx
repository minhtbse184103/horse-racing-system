import { motion } from 'framer-motion';
import { Circle, CircleCheck } from 'lucide-react';
import { tournamentLifecycle } from '../../../../data/tournamentPrototype';
import { tournamentStatusLabels } from '../../../../lib/eventFormatters';
import TournamentStatusBadge from '../TournamentStatusBadge';

export default function TournamentLifecycle({ status }) {
  if (status === 'CANCELLED') return <TournamentStatusBadge status={status} />;

  const current = tournamentLifecycle.indexOf(status);

  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-0">
      {tournamentLifecycle.map((stage, index) => {
        const complete = index < current;
        const active = index === current;

        return (
          <li key={stage} className="relative flex items-center gap-2 sm:block sm:text-center">
            {index > 0 && (
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className={`absolute right-1/2 top-3 hidden h-px w-full sm:block ${
                  index <= current ? 'bg-emerald-600' : 'bg-brown-700/15'
                } origin-right`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full border sm:mx-auto ${
                complete
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : active
                    ? 'border-gold-400 bg-gold-400 text-brown-900 shadow-[0_0_0_4px_rgba(217,164,65,0.16)]'
                    : 'border-brown-700/15 bg-white text-slate-500'
              }`}
            >
              {complete ? <CircleCheck size={15} /> : <Circle size={8} fill="currentColor" />}
            </span>
            <span
              className={`text-xs font-extrabold sm:mt-2 sm:block ${
                active ? 'text-brown-900' : complete ? 'text-emerald-800' : 'text-slate-500'
              }`}
            >
              {tournamentStatusLabels[stage]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
