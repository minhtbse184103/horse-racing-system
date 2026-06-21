import { motion } from 'framer-motion';
import { formatTournamentCondition } from '../../../../lib/eventFormatters';
import TournamentOperationsPanel from '../TournamentOperationsPanel';
import TournamentLifecycle from './TournamentLifecycle';
import TournamentLifecycleActions from './TournamentLifecycleActions';
import { formatTournamentDate, getTournamentPrizeTotal } from './tournamentWorkspaceUtils';
import VenueImage from './VenueImage';

export default function TournamentDetails({
  tournament,
  registrations,
  registrationsLoading,
  registrationsError,
  retryRegistrations,
  approveRegistration,
  rejectRegistration,
  onRaceEntryCountChange,
  onLifecycleAction,
  lifecycleProcessingId,
  adminName
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.24 }}
      className="border-t border-brown-700/10"
    >
      <div className="grid gap-4 bg-cream-200/35 px-4 py-4 md:px-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(17rem,.75fr)]">
        <section className="rounded-lg border border-brown-700/10 bg-white/75 p-4">
          <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
            <VenueImage tournament={tournament} className="aspect-[16/10] w-full rounded-lg border border-brown-700/10" />
            <div><p className="text-xs font-black uppercase text-brown-500">Tournament summary</p><p className="mt-2 text-sm font-semibold leading-6 text-brown-900">{tournament.description}</p></div>
          </div>
          <dl className="mt-3 grid gap-3 border-t border-brown-700/10 pt-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs font-extrabold text-slate-500">Registration</dt><dd className="mt-1 font-black text-brown-900">{formatTournamentDate(tournament.registrationOpen)} - {formatTournamentDate(tournament.registrationClose)}</dd></div>
            <div><dt className="text-xs font-extrabold text-slate-500">Tournament</dt><dd className="mt-1 font-black text-brown-900">{formatTournamentDate(tournament.start)} - {formatTournamentDate(tournament.end)}</dd></div>
            <div><dt className="text-xs font-extrabold text-slate-500">Entry fee</dt><dd className="mt-1 font-black text-brown-900">THB {tournament.entryFee.toLocaleString()}</dd></div>
            <div><dt className="text-xs font-extrabold text-slate-500">Prize total</dt><dd className="mt-1 font-black text-brown-900">THB {getTournamentPrizeTotal(tournament).toLocaleString()}</dd></div>
          </dl>
        </section>
        <section className="rounded-lg border border-brown-700/10 bg-white/75 p-4">
          <p className="text-xs font-black uppercase text-brown-500">Status timeline</p>
          <div className="mt-3"><TournamentLifecycle status={tournament.status} /></div>
          <TournamentLifecycleActions tournament={tournament} processing={lifecycleProcessingId === tournament.id} onAction={onLifecycleAction} />
        </section>
      </div>

      <TournamentOperationsPanel
        tournament={tournament}
        registrations={registrations}
        registrationsLoading={registrationsLoading}
        registrationsError={registrationsError}
        retryRegistrations={retryRegistrations}
        approveRegistration={approveRegistration}
        rejectRegistration={rejectRegistration}
        onRaceEntryCountChange={onRaceEntryCountChange}
        adminName={adminName}
      />

      <section className="border-t border-brown-700/10 bg-cream-200/35 px-4 pb-4 md:px-5">
        <div className="rounded-lg border border-brown-700/10 bg-white/75 p-4">
          <p className="text-xs font-black uppercase text-brown-500">Tournament conditions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tournament.conditions.map((condition) => (
              <span key={condition.id || formatTournamentCondition(condition)} className="rounded-full border border-brown-700/10 bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700">
                {formatTournamentCondition(condition)}
              </span>
            ))}
            {tournament.conditions.length === 0 && <span className="text-sm font-semibold text-slate-500">No eligibility restrictions.</span>}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
