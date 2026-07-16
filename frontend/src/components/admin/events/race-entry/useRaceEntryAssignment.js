import { useCallback, useEffect, useRef, useState } from 'react';
import {
  adaptRaceEntry,
  adaptRaceEntryCandidates,
  adaptRaceEntries
} from '../../../../adapters/raceEntryAdapter';
import {
  cancelRaceEntry,
  createRaceEntry,
  getAssignmentQueueByTournament,
  getRaceEntriesByRace
} from '../../../../services/raceEntryService';

export default function useRaceEntryAssignment(
  tournamentId,
  raceId,
  onEntryCountChange,
  queueRefreshKey = 0,
  messages = {}
) {
  const [candidates, setCandidates] = useState([]);
  const [entries, setEntries] = useState([]);
  const [entriesRaceId, setEntriesRaceId] = useState(raceId ?? null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [entriesLoading, setEntriesLoading] = useState(Boolean(raceId));
  const [entriesError, setEntriesError] = useState('');
  const queueSequence = useRef(0);
  const entriesSequence = useRef(0);

  const loadQueue = useCallback(async () => {
    // FLOW: Admin RaceEntry Assignment Queue Load
    // ORDER: 2/7 - Hook calls the tournament-scoped queue endpoint, adapts candidates, and stores loading/error state.
    // FE path: RaceEntryAssignmentPanel -> getAssignmentQueueByTournament -> backend eligibility query.
    // Purpose: load only Registration candidates that are APPROVED, PAID, and not actively assigned.
    if (tournamentId == null) return;
    const sequence = ++queueSequence.current;
    setQueueLoading(true);
    setQueueError('');
    try {
      const adapted = adaptRaceEntryCandidates(
        await getAssignmentQueueByTournament(tournamentId)
      );
      if (sequence === queueSequence.current) setCandidates(adapted);
    } catch (error) {
      if (sequence === queueSequence.current) setQueueError(error.message || messages.queueLoadError || 'Unable to load assignable Registration list.');
    } finally {
      if (sequence === queueSequence.current) setQueueLoading(false);
    }
  }, [messages.queueLoadError, tournamentId]);

  const loadEntries = useCallback(async () => {
    // FLOW: Admin Assigned RaceEntry Load
    // ORDER: 2/6 - Hook loads by-race entries, adapts them, and pushes the loaded count back to workspace state.
    // FE path: selected Race -> getRaceEntriesByRace -> backend ASSIGNED RaceEntry query.
    // Purpose: display official RaceEntry slots and push the loaded count back into the Tournament workspace.
    if (raceId == null) {
      setEntries([]);
      setEntriesRaceId(null);
      setEntriesLoading(false);
      setEntriesError('');
      return;
    }
    const sequence = ++entriesSequence.current;
    setEntriesLoading(true);
    setEntriesRaceId(null);
    setEntriesError('');
    try {
      const adapted = adaptRaceEntries(await getRaceEntriesByRace(raceId));
      if (sequence === entriesSequence.current) {
        setEntries(adapted);
        setEntriesRaceId(raceId);
        onEntryCountChange?.(raceId, adapted.length);
      }
    } catch (error) {
      if (sequence === entriesSequence.current) setEntriesError(error.message || messages.entriesLoadError || 'Unable to load assigned RaceEntry records.');
    } finally {
      if (sequence === entriesSequence.current) setEntriesLoading(false);
    }
  }, [messages.entriesLoadError, onEntryCountChange, raceId]);

  useEffect(() => {
    loadQueue();
    return () => { queueSequence.current += 1; };
  }, [loadQueue, queueRefreshKey]);

  useEffect(() => {
    loadEntries();
    return () => { entriesSequence.current += 1; };
  }, [loadEntries]);

  async function assignRegistration(registrationId) {
    // FLOW: Admin Assign RaceEntry
    // ORDER: 2/8 - Hook posts selected Race/Registration, adapts backend response, updates entries, then refreshes queue.
    // FE path: AssignmentDialog selection -> POST /api/admin/race-entries.
    // Purpose: use the backend-created RaceEntry response, then refresh the candidate queue because assigned Registration is no longer eligible.
    const assignedEntry = adaptRaceEntry(
      await createRaceEntry({ raceId, registrationId })
    );

    const nextEntries = [
      ...entries.filter((entry) => entry.id !== assignedEntry.id),
      assignedEntry
    ];
    setEntries(nextEntries);
    onEntryCountChange?.(raceId, nextEntries.length);
    await loadQueue();
    return assignedEntry;
  }

  async function cancelEntry(raceEntryId, cancellationReason) {
    // FLOW: Admin Cancel RaceEntry
    // ORDER: 3/6 - Hook calls cancel API, adapts response, then refreshes assigned entries and the candidate queue.
    // FE path: CancellationDialog -> PUT /api/admin/race-entries/{raceEntryId}/cancel.
    // Purpose: use backend cancellation as source of truth, then refresh entries and queue so the Registration can reappear if eligible.
    const cancelledEntry = adaptRaceEntry(
      await cancelRaceEntry(raceEntryId, cancellationReason)
    );

    await Promise.all([loadEntries(), loadQueue()]);
    return cancelledEntry;
  }

  return {
    candidates,
    entries,
    entriesRaceId,
    queueLoading,
    queueError,
    entriesLoading,
    entriesError,
    retryQueue: loadQueue,
    retryEntries: loadEntries,
    assignRegistration,
    cancelEntry
  };
}
