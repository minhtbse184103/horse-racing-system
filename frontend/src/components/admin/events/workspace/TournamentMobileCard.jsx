import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import TournamentStatusBadge from '../TournamentStatusBadge';
import RegistrationCapacity from './RegistrationCapacity';
import TournamentActions from './TournamentActions';
import TournamentDetails from './TournamentDetails';
import { formatTournamentDate } from './tournamentWorkspaceUtils';
import VenueImage from './VenueImage';

export default function TournamentMobileCard({
  tournament,
  registrationCount,
  expanded,
  onToggle,
  onEdit,
  onClone,
  onDelete,
  operationsProps
}) {
  return (
    <motion.article layout className="border-b border-brown-700/10 last:border-b-0">
      <div className="p-5">
        <VenueImage tournament={tournament} className="mb-4 aspect-[16/7] w-full rounded-lg border border-brown-700/10" />
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onToggle} className="min-w-0 text-left">
            <span className="block text-base font-black leading-6 text-brown-900">{tournament.name}</span>
            <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <MapPin size={13} className="text-brown-500" />
              {tournament.venue}
            </span>
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-cream-200 text-brown-700"
            aria-label={expanded ? 'Thu gọn thông tin Tournament' : 'Mở rộng thông tin Tournament'}
          >
            {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <TournamentStatusBadge status={tournament.status} />
          <span className="text-xs font-extrabold text-slate-500">
            {formatTournamentDate(tournament.start)} - {formatTournamentDate(tournament.end)}
          </span>
        </div>

        <div className="mt-4 rounded-lg bg-cream-200/55 p-3">
          <RegistrationCapacity value={registrationCount} max={tournament.maxRegistration} showLabel />
        </div>

        <div className="mt-4">
          <TournamentActions
            tournament={tournament}
            onEdit={onEdit}
            onClone={onClone}
            onDelete={onDelete}
            compact
          />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && <TournamentDetails tournament={tournament} {...operationsProps} />}
      </AnimatePresence>
    </motion.article>
  );
}
