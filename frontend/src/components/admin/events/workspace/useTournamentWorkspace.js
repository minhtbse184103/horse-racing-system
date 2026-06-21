import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adaptTournament } from '../../../../adapters/tournamentAdapter';
import { adaptRegistration, adaptRegistrations } from '../../../../adapters/registrationAdapter';
import {
  approveRegistration as approveRegistrationRequest,
  getRegistrations,
  rejectRegistration as rejectRegistrationRequest
} from '../../../../services/adminRegistrationService';
import {
  cancelTournament,
  closeTournamentRegistration,
  completeTournament,
  getRacesByTournament,
  getTournamentById,
  getTournaments
} from '../../../../services/eventService';
import {
  createTournamentProgramme,
  updateTournamentProgramme
} from '../../../../services/tournamentPersistenceService';
import { buildRegistrationCounts } from './tournamentWorkspaceUtils';

export default function useTournamentWorkspace() {
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [wizardTournament, setWizardTournament] = useState(undefined);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [lifecycleProcessingId, setLifecycleProcessingId] = useState(null);
  const loadSequence = useRef(0);
  const registrationLoadSequence = useRef(0);

  const loadTournaments = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setIsLoading(true);
    setLoadError('');

    try {
      const summaries = await getTournaments();
      if (!Array.isArray(summaries)) {
        throw new Error('The tournament service returned an invalid response.');
      }

      const adaptedTournaments = await Promise.all(
        summaries.map(async (summary) => {
          const tournamentId = summary.tournamentId;
          const [detail, races] = await Promise.all([
            getTournamentById(tournamentId),
            getRacesByTournament(tournamentId)
          ]);

          return adaptTournament(
            { ...summary, ...detail },
            Array.isArray(races) ? races : []
          );
        })
      );

      if (sequence === loadSequence.current) {
        setTournaments(adaptedTournaments);
      }
    } catch (error) {
      if (sequence === loadSequence.current) {
        setLoadError(error.message || 'Unable to load tournaments.');
      }
    } finally {
      if (sequence === loadSequence.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    const sequence = ++registrationLoadSequence.current;
    setRegistrationsLoading(true);
    setRegistrationsError('');

    try {
      const response = await getRegistrations();
      const adaptedRegistrations = adaptRegistrations(response);

      if (sequence === registrationLoadSequence.current) {
        setRegistrations(adaptedRegistrations);
      }
    } catch (error) {
      if (sequence === registrationLoadSequence.current) {
        setRegistrationsError(error.message || 'Unable to load registrations.');
      }
    } finally {
      if (sequence === registrationLoadSequence.current) {
        setRegistrationsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadTournaments();
    loadRegistrations();

    return () => {
      loadSequence.current += 1;
      registrationLoadSequence.current += 1;
    };
  }, [loadRegistrations, loadTournaments]);

  async function approveRegistration(registrationId) {
    const updated = adaptRegistration(
      await approveRegistrationRequest(registrationId)
    );
    setRegistrations((current) => current.map((registration) =>
      registration.id === updated.id ? updated : registration
    ));
    return updated;
  }

  async function rejectRegistration(registrationId, rejectionReason) {
    const updated = adaptRegistration(
      await rejectRegistrationRequest(registrationId, rejectionReason)
    );
    setRegistrations((current) => current.map((registration) =>
      registration.id === updated.id ? updated : registration
    ));
    return updated;
  }

  const filteredTournaments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tournaments.filter((tournament) => {
      const matchesStatus = statusFilter === 'ALL' || tournament.status === statusFilter;
      const matchesSearch =
        !query ||
        [tournament.name, tournament.venue, tournament.description, tournament.status].some((value) =>
          String(value).toLowerCase().includes(query)
        );

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tournaments]);

  const registrationCounts = useMemo(
    () => buildRegistrationCounts(registrations),
    [registrations]
  );

  const metrics = useMemo(() => {
    const visibleTournamentIds = new Set(tournaments.map((tournament) => tournament.id));

    return {
      tournamentCount: tournaments.length,
      registrationCount: registrations.filter((registration) =>
        visibleTournamentIds.has(registration.tournamentId)
      ).length,
      raceCount: tournaments.reduce((sum, tournament) => sum + tournament.races.length, 0),
      raceEntryCount: tournaments.reduce(
        (total, tournament) => total + tournament.races.reduce((sum, race) => sum + Number(race.entries || 0), 0),
        0
      )
    };
  }, [registrations, tournaments]);

  const hasFilters = Boolean(search.trim()) || statusFilter !== 'ALL';

  function clearFilters() {
    setSearch('');
    setStatusFilter('ALL');
  }

  function openCreate() {
    setMutationError('');
    setWizardTournament(undefined);
    setWizardOpen(true);
  }

  function openEdit(tournament) {
    setMutationError('');
    setWizardTournament(tournament);
    setWizardOpen(true);
  }

  function openClone(tournament) {
    setMutationError('');
    setWizardTournament({
      ...tournament,
      id: undefined,
      name: `${tournament.name} Copy`,
      status: 'OPEN_FOR_REGISTRATION',
      venueImageUrl: '',
      venueImageSrc: '',
      venueImageFile: null,
      venueImageRemoved: false,
      registrationCount: 0,
      races: tournament.races.map((race, index) => ({
        ...race,
        id: `clone-race-${index + 1}`,
        raceOrder: index + 1,
        entries: 0,
        status: 'OPEN_FOR_REGISTRATION'
      }))
    });
    setWizardOpen(true);
  }

  async function saveTournament(tournament) {
    setMutationError('');
    try {
      const tournamentId = tournament.id
        ? await updateTournamentProgramme(wizardTournament, tournament)
        : await createTournamentProgramme(tournament);
      await loadTournaments();
      setExpandedId(tournamentId);
      setWizardOpen(false);
      setNotice(`${tournament.name} saved successfully.`);
      return tournamentId;
    } catch (error) {
      await loadTournaments();
      setMutationError(error.message || 'Unable to save this tournament.');
      if (error.partialTournamentId) {
        setExpandedId(error.partialTournamentId);
        setWizardOpen(false);
        return error.partialTournamentId;
      }
      throw error;
    }
  }

  async function deleteTournament() {
    const target = deleteTarget;
    setMutationError('');
    try {
      await cancelTournament(target.id);
      await loadTournaments();
      setDeleteTarget(null);
      setNotice(`${target.name} was cancelled successfully.`);
    } catch (error) {
      setMutationError(error.message || 'Unable to cancel this tournament.');
      throw error;
    }
  }

  async function transitionTournament(tournament, action) {
    setLifecycleProcessingId(tournament.id);
    setMutationError('');
    try {
      if (action === 'close') {
        await closeTournamentRegistration(tournament.id);
      } else if (action === 'complete') {
        await completeTournament(tournament.id);
      }
      await loadTournaments();
      setNotice(`${tournament.name} status updated successfully.`);
    } catch (error) {
      setMutationError(error.message || 'Unable to update tournament status.');
    } finally {
      setLifecycleProcessingId(null);
    }
  }

  function toggleExpanded(tournamentId) {
    setExpandedId((current) => (current === tournamentId ? null : tournamentId));
  }

  const updateRaceEntryCount = useCallback((raceId, entryCount) => {
    setTournaments((current) => current.map((tournament) => ({
      ...tournament,
      races: tournament.races.map((race) => race.id === raceId
        ? { ...race, entries: entryCount, availableStalls: Math.max(0, race.maxRunners - entryCount) }
        : race)
    })));
  }, []);

  return {
    tournaments,
    isLoading,
    loadError,
    retryLoad: loadTournaments,
    registrations,
    registrationsLoading,
    registrationsError,
    retryRegistrations: loadRegistrations,
    approveRegistration,
    rejectRegistration,
    updateRaceEntryCount,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    expandedId,
    filteredTournaments,
    registrationCounts,
    metrics,
    hasFilters,
    wizardTournament,
    wizardOpen,
    closeWizard: () => setWizardOpen(false),
    deleteTarget,
    setDeleteTarget,
    notice,
    mutationError,
    dismissMutationError: () => setMutationError(''),
    lifecycleProcessingId,
    dismissNotice: () => setNotice(''),
    clearFilters,
    openCreate,
    openEdit,
    openClone,
    saveTournament,
    deleteTournament,
    transitionTournament,
    toggleExpanded
  };
}
