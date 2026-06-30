import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adaptWorkspaceTournament } from '../../../../adapters/tournamentAdapter';
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
  getTournamentWorkspace
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
  const [refreshing, setRefreshing] = useState(false);
  const loadSequence = useRef(0);
  const registrationLoadSequence = useRef(0);

  const loadTournaments = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await getTournamentWorkspace();
      if (!Array.isArray(response)) {
        throw new Error('Dịch vụ Tournament trả về dữ liệu không hợp lệ.');
      }

      const adaptedTournaments = response.map(adaptWorkspaceTournament);

      if (sequence === loadSequence.current) {
        setTournaments(adaptedTournaments);
      }
    } catch (error) {
      if (sequence === loadSequence.current) {
        setLoadError(error.message || 'Không thể tải Tournament.');
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
        setRegistrationsError(error.message || 'Không thể tải Registration.');
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
      name: `${tournament.name} - Bản sao`,
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
      setNotice(`Đã lưu ${tournament.name} thành công.`);
      return tournamentId;
    } catch (error) {
      await loadTournaments();
      setMutationError(error.message || 'Không thể lưu Tournament này.');
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
      setNotice(`Đã hủy ${target.name} thành công.`);
    } catch (error) {
      setMutationError(error.message || 'Không thể hủy Tournament này.');
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
      setNotice(`Đã cập nhật Status của ${tournament.name} thành công.`);
    } catch (error) {
      setMutationError(error.message || 'Không thể cập nhật Status của Tournament.');
    } finally {
      setLifecycleProcessingId(null);
    }
  }

  async function refreshWorkspace() {
    setRefreshing(true);
    setMutationError('');
    try {
      await Promise.all([
        loadTournaments(),
        loadRegistrations()
      ]);
      setNotice('Đã làm mới dữ liệu Tournament.');
    } finally {
      setRefreshing(false);
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

  // Patches a single race's status in local state when the WebSocket RESULT
  // envelope arrives (see RaceLiveView/useRaceLiveView), so the workspace
  // reflects IN_PROGRESS -> COMPLETED immediately instead of staying stale
  // until the next full loadTournaments() (e.g. a save/delete/lifecycle
  // action). status comes from the backend's RaceResultIngestResponse, not
  // a hardcoded string, so this stays correct if that logic changes.
  //
  // Bails out (returns the same array reference) when the race already has
  // this status. RaceLiveView's onResult callback is an inline function
  // recreated on every render of its parent, so its useEffect can re-fire
  // with an unchanged `result` whenever something unrelated re-renders the
  // tree. Without this guard, every redundant call would still produce a
  // new tournaments array -> re-render -> new onResult reference -> effect
  // fires again, looping indefinitely.
  const updateRaceStatus = useCallback((raceId, status) => {
    setTournaments((current) => {
      const race = current
        .flatMap((tournament) => tournament.races)
        .find((candidate) => candidate.id === raceId);

      if (!race || race.status === status) {
        return current;
      }

      return current.map((tournament) => ({
        ...tournament,
        races: tournament.races.map((candidate) => candidate.id === raceId
          ? { ...candidate, status }
          : candidate)
      }));
    });
  }, []);

  return {
    tournaments,
    isLoading,
    loadError,
    retryLoad: loadTournaments,
    refreshWorkspace,
    refreshing,
    registrations,
    registrationsLoading,
    registrationsError,
    retryRegistrations: loadRegistrations,
    approveRegistration,
    rejectRegistration,
    updateRaceEntryCount,
    updateRaceStatus,
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
