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
  queueRefreshKey = 0
) {
  const [candidates, setCandidates] = useState([]);
  const [entries, setEntries] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [entriesLoading, setEntriesLoading] = useState(Boolean(raceId));
  const [entriesError, setEntriesError] = useState('');
  const queueSequence = useRef(0);
  const entriesSequence = useRef(0);

  const loadQueue = useCallback(async () => {
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
      if (sequence === queueSequence.current) setQueueError(error.message || 'Unable to load assignment candidates.');
    } finally {
      if (sequence === queueSequence.current) setQueueLoading(false);
    }
  }, [tournamentId]);

  const loadEntries = useCallback(async () => {
    if (raceId == null) {
      setEntries([]);
      setEntriesLoading(false);
      setEntriesError('');
      return;
    }
    const sequence = ++entriesSequence.current;
    setEntriesLoading(true);
    setEntriesError('');
    try {
      const adapted = adaptRaceEntries(await getRaceEntriesByRace(raceId));
      if (sequence === entriesSequence.current) {
        setEntries(adapted);
        onEntryCountChange?.(raceId, adapted.length);
      }
    } catch (error) {
      if (sequence === entriesSequence.current) setEntriesError(error.message || 'Unable to load assigned entries.');
    } finally {
      if (sequence === entriesSequence.current) setEntriesLoading(false);
    }
  }, [onEntryCountChange, raceId]);

  useEffect(() => {
    loadQueue();
    return () => { queueSequence.current += 1; };
  }, [loadQueue, queueRefreshKey]);

  useEffect(() => {
    loadEntries();
    return () => { entriesSequence.current += 1; };
  }, [loadEntries]);

  async function assignRegistration(registrationId) {
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
    const cancelledEntry = adaptRaceEntry(
      await cancelRaceEntry(raceEntryId, cancellationReason)
    );

    await Promise.all([loadEntries(), loadQueue()]);
    return cancelledEntry;
  }

  return {
    candidates,
    entries,
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
