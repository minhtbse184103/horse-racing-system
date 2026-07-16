import {
  isPersistedRace,
  toCreateRaceRequest,
  toCreateTournamentProgramRequest,
  toTournamentRequest,
  toUpdateRaceRequest
} from '../adapters/tournamentPersistenceAdapter';
import {
  cancelRace,
  createRace,
  createTournamentProgram as createTournamentProgramRequest,
  removeRaceTrackImage,
  removeTournamentVenueImage,
  uploadRaceTrackImage,
  uploadTournamentVenueImage,
  updateRace,
  updateTournament
} from './eventService';

function persistenceError(message, cause, partialTournamentId = null) {
  const error = new Error(`${message}${cause?.message ? ` ${cause.message}` : ''}`);
  error.partialTournamentId = partialTournamentId;
  return error;
}

async function syncRaceTrackImage(raceId, race) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 7D/8 - After Race create/update succeeds, sync the Race track image if the edit draft changed it.
  // Purpose: sync a persisted Race's track image after the Race create/update request succeeds.
  // FLOW: Admin Tournament Images
  // ORDER: 2R/7 - Persistence service uploads/removes track image only after the Race JSON row exists.
  // Purpose: upload/remove track images separately from Race JSON so file transfer failures can be reported without corrupting Race data.
  if (race.trackImageFile) {
    await uploadRaceTrackImage(raceId, race.trackImageFile);
  } else if (race.trackImageRemoved && race.trackImageUrl) {
    await removeRaceTrackImage(raceId);
  }
}

async function syncCreatedRaceTrackImages(savedTournament, draft) {
  // FLOW: Admin Tournament Images
  // ORDER: 2R/7 - After atomic create, match saved Race IDs by raceOrder before uploading selected track images.
  // Purpose: after atomic Tournament Program create, match saved Races by raceOrder and upload any selected track images.
  const savedRaces = Array.isArray(savedTournament?.races) ? savedTournament.races : [];
  const savedRaceByOrder = new Map(
    savedRaces.map((race) => [Number(race.raceOrder), race])
  );

  for (const race of draft.races) {
    if (!race.trackImageFile) continue;

    const raceOrder = Number(race.raceOrder || draft.races.indexOf(race) + 1);
    const savedRace = savedRaceByOrder.get(raceOrder);

    if (!savedRace?.raceId) {
      throw new Error(`Không tìm thấy Race đã lưu cho ${race.name}.`);
    }

    await uploadRaceTrackImage(savedRace.raceId, race.trackImageFile);
  }
}

export async function createTournamentProgram(draft) {
  // FLOW: Admin Create Tournament Program
  // ORDER: 4/8 - Persistence service creates the JSON program first, then handles post-create image uploads.
  // FE path: TournamentWizard -> useTournamentWorkspace -> tournamentPersistenceService.
  // Purpose: create Tournament + initial Races + RacePrizes atomically first; upload venue/track images only after JSON creation succeeds.
  // ORDER: 4/4 for Admin Clone Tournament - cloned drafts arrive here after openClone() clears IDs; there is intentionally no dedicated clone endpoint.
  const tournament = await createTournamentProgramRequest(
    toCreateTournamentProgramRequest(draft)
  );
  const tournamentId = tournament.tournamentId;

  if (draft.venueImageFile) {
    try {
      // FLOW: Admin Tournament Images
      // ORDER: 2V/7 - After atomic JSON create, upload selected venue image through the separate image endpoint.
      // Purpose: venue image upload happens after atomic JSON create because multipart files are stored through a separate Cloudinary-backed endpoint.
      await uploadTournamentVenueImage(tournamentId, draft.venueImageFile);
    } catch (error) {
      throw persistenceError(
        `Đã tạo ${draft.name} và chương trình Race, nhưng không thể tải hình địa điểm lên. Hãy chỉnh sửa Tournament đã lưu để thử tải hình lại.`,
        error,
        tournamentId
      );
    }
  }

  try {
    await syncCreatedRaceTrackImages(tournament, draft);
  } catch (error) {
    throw persistenceError(
      `Đã tạo ${draft.name} và chương trình Race, nhưng không thể tải hình đường đua lên. Hãy chỉnh sửa Tournament đã lưu để thử tải hình lại.`,
      error,
      tournamentId
    );
  }

  return tournamentId;
}

export async function updateTournamentProgram(original, draft) {
  // FLOW: Admin Edit Tournament Program
  // ORDER: 3/8 - Persistence service coordinates Tournament update, Race sync branches, prize replacement, and image sync.
  // FE path: TournamentWizard edit save -> useTournamentWorkspace -> tournamentPersistenceService.
  // Purpose: update Tournament fields first, then synchronize existing Races, newly added Races, removed Races, prizes, and images.
  await updateTournament(draft.id, toTournamentRequest(draft));

  const originalRaces = original.races.filter(isPersistedRace);
  const retainedRaceIds = new Set(draft.races.filter(isPersistedRace).map((race) => race.id));
  const maximumExistingOrder = originalRaces.reduce(
    (maximum, race) => Math.max(maximum, Number(race.raceOrder || 0)),
    0
  );
  let nextRaceOrder = maximumExistingOrder + 1;

  for (const race of draft.races) {
    try {
      if (isPersistedRace(race)) {
        // FLOW: Admin Edit Tournament Program
        // ORDER: 7A/8 - Existing Race branch calls PUT /api/races/{id} and then syncs track image changes.
        // Purpose: existing Race branch updates schedule, track, capacity, and prize rules, then syncs track image changes.
        await updateRace(
          race.id,
          toUpdateRaceRequest(race, Number(race.raceOrder || 1))
        );
        await syncRaceTrackImage(race.id, race);
      } else {
        // FLOW: Admin Edit Tournament Program
        // ORDER: 7B/8 - New Race branch calls POST /api/races and then uploads its optional track image.
        // Purpose: newly added Race branch creates a Race under the current Tournament, then uploads its optional track image.
        const savedRace = await createRace(toCreateRaceRequest(race, draft.id, nextRaceOrder));
        await syncRaceTrackImage(savedRace.raceId, race);
        nextRaceOrder += 1;
      }
    } catch (error) {
      throw persistenceError(
        `Đã cập nhật ${draft.name}, nhưng không thể đồng bộ Race ${race.name}. Hãy tải lại Tournament trước khi thử lại.`,
        error
      );
    }
  }

  for (const race of originalRaces) {
    if (!retainedRaceIds.has(race.id)) {
      try {
        // FLOW: Admin Edit Tournament Program
        // ORDER: 7C/8 - Removed Race branch calls DELETE /api/races/{id} so history is cancelled, not physically deleted.
        // Purpose: removed Race branch cancels the persisted Race instead of deleting history.
        await cancelRace(race.id);
      } catch (error) {
        throw persistenceError(
          `Đã cập nhật ${draft.name}, nhưng không thể hủy Race ${race.name} đã bị xóa. Hãy tải lại Tournament trước khi thử lại.`,
          error
        );
      }
    }
  }

  try {
    if (draft.venueImageFile) {
      // FLOW: Admin Tournament Images
      // ORDER: 2V/7 - After edit synchronization succeeds, upload the replacement venue image.
      // Purpose: edit flow updates/removes the venue image only after Tournament/Race synchronization succeeds.
      await uploadTournamentVenueImage(draft.id, draft.venueImageFile);
    } else if (draft.venueImageRemoved && original.venueImageUrl) {
      await removeTournamentVenueImage(draft.id);
    }
  } catch (error) {
    throw persistenceError(
      `Đã lưu ${draft.name} và các Race, nhưng không thể hoàn tất thay đổi hình địa điểm. Hãy tải lại Tournament trước khi thử lại.`,
      error
    );
  }

  return draft.id;
}
