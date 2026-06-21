import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronRight, Flag, LoaderCircle, RefreshCw, UserPlus } from 'lucide-react';
import AssignmentDialog from './AssignmentDialog';
import CancellationDialog from './CancellationDialog';
import OfficialEntries from './OfficialEntries';
import useRaceEntryAssignment from './useRaceEntryAssignment';
import { formatRaceSchedule } from '../../../../lib/eventFormatters';

export default function RaceEntryAssignmentPanel({ tournament, onRaceEntryCountChange, queueRefreshKey }) {
  const [selectedRaceId, setSelectedRaceId] = useState(tournament.races[0]?.id || null);
  const [assignmentRace, setAssignmentRace] = useState(null);
  const [cancellationEntry, setCancellationEntry] = useState(null);
  const assignment = useRaceEntryAssignment(
    tournament.id,
    selectedRaceId,
    onRaceEntryCountChange,
    queueRefreshKey
  );

  function selectRace(raceId) {
    setSelectedRaceId((current) => current === raceId ? null : raceId);
  }

  function openAssignment(race) {
    setSelectedRaceId(race.id);
    setAssignmentRace(race);
  }

  return (
    <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/75 shadow-[0_10px_30px_rgba(78,44,25,0.07)]">
      <header className="flex flex-col gap-3 border-b border-brown-700/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-black uppercase text-brown-500">Race entry assignment</p><h4 className="mt-1 text-lg font-black text-brown-900">Race programme and official entries</h4><p className="mt-0.5 text-xs font-semibold text-slate-500">Choose a race, review its capacity, then assign approved and paid registrations.</p></div>
        <span className="shrink-0 rounded-full bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700">{tournament.races.length} races</span>
      </header>

      <div className="divide-y divide-brown-700/10">
        {tournament.races.map((race, index) => {
          const selected = selectedRaceId === race.id;
          const runnerCount = selected && !assignment.entriesLoading && !assignment.entriesError
            ? assignment.entries.length
            : Number(race.entries || 0);
          const isFull = runnerCount >= race.maxRunners;

          return (
            <Fragment key={race.id}>
              <motion.div layout className={`grid gap-3 px-4 py-3.5 transition-colors lg:grid-cols-[2.25rem_minmax(0,1fr)_6rem_6rem_auto] lg:items-center ${selected ? 'bg-white/70 shadow-[inset_3px_0_0_#d9a441]' : 'hover:bg-white/45'}`}>
                <button type="button" onClick={() => selectRace(race.id)} className={`grid size-9 place-items-center rounded-lg ${selected ? 'bg-brown-700 text-white' : 'bg-cream-200 text-brown-700'}`} aria-label={selected ? 'Collapse race' : 'Expand race'}>{selected ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
                <button type="button" onClick={() => selectRace(race.id)} className="min-w-0 text-left"><p className="text-xs font-black uppercase text-brown-500">Race {String(index + 1).padStart(2, '0')}</p><h5 className="mt-1 truncate font-black text-brown-900">{race.name}</h5><p className="mt-1 truncate text-xs font-semibold text-slate-500">{race.track} · {formatRaceSchedule(race)} · {race.distance}m</p></button>
                <div><p className="text-xs font-extrabold text-slate-500">Runners</p><p className="mt-1 font-black text-brown-900">{runnerCount}/{race.maxRunners}</p></div>
                <div><p className="text-xs font-extrabold text-slate-500">Prize ranks</p><p className="mt-1 font-black text-brown-900">{race.prizes.length}</p></div>
                <button type="button" disabled={isFull || assignment.queueLoading} onClick={() => openAssignment(race)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 text-xs font-extrabold text-brown-700 hover:bg-cream-200 disabled:cursor-not-allowed disabled:border-red-200 disabled:bg-red-50 disabled:text-red-700"><UserPlus size={15} />{isFull ? 'Race full' : 'Assign runners'}</button>
              </motion.div>

              <AnimatePresence initial={false}>
                {selected && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} className="overflow-hidden bg-cream-200/30">
                    <div className="px-4 py-3.5">
                      {assignment.entriesLoading ? (
                        <div className="grid min-h-36 place-items-center rounded-lg border border-brown-700/10 bg-white/75 text-center"><div><LoaderCircle className="mx-auto animate-spin text-brown-500" size={23} /><p className="mt-3 text-sm font-black text-brown-900">Loading official entries</p></div></div>
                      ) : assignment.entriesError ? (
                        <div className="grid min-h-36 place-items-center rounded-lg border border-red-200 bg-red-50 p-5 text-center"><div><AlertTriangle className="mx-auto text-danger" size={22} /><p className="mt-3 text-sm font-black text-brown-900">Entries could not be loaded</p><p className="mt-1 text-xs font-semibold text-slate-500">{assignment.entriesError}</p><button type="button" onClick={assignment.retryEntries} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-brown-700 px-3 text-xs font-extrabold text-white"><RefreshCw size={13} /> Retry</button></div></div>
                      ) : <OfficialEntries race={race} entries={assignment.entries} onCancel={setCancellationEntry} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Fragment>
          );
        })}

        {tournament.races.length === 0 && <div className="grid min-h-44 place-items-center p-6 text-center"><div><Flag className="mx-auto text-brown-500" size={24} /><p className="mt-3 font-black text-brown-900">No races configured</p><p className="mt-1 text-sm font-semibold text-slate-500">Edit the tournament to create its race programme before assigning entries.</p></div></div>}
      </div>

      <AnimatePresence>
        {assignmentRace && (
          <AssignmentDialog
            tournament={tournament}
            race={assignmentRace}
            candidates={assignment.candidates}
            entries={assignment.entries}
            queueLoading={assignment.queueLoading}
            queueError={assignment.queueError}
            onRetryQueue={assignment.retryQueue}
            onClose={() => setAssignmentRace(null)}
            onAssign={assignment.assignRegistration}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancellationEntry && (
          <CancellationDialog
            entry={cancellationEntry}
            onClose={() => setCancellationEntry(null)}
            onConfirm={assignment.cancelEntry}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
