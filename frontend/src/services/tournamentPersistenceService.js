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
  if (race.trackImageFile) {
    await uploadRaceTrackImage(raceId, race.trackImageFile);
  } else if (race.trackImageRemoved && race.trackImageUrl) {
    await removeRaceTrackImage(raceId);
  }
}

async function syncCreatedRaceTrackImages(savedTournament, draft) {
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
  const tournament = await createTournamentProgramRequest(
    toCreateTournamentProgramRequest(draft)
  );
  const tournamentId = tournament.tournamentId;

  if (draft.venueImageFile) {
    try {
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
        await updateRace(
          race.id,
          toUpdateRaceRequest(race, Number(race.raceOrder || 1))
        );
        await syncRaceTrackImage(race.id, race);
      } else {
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
