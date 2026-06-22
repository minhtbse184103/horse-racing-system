import {
  isPersistedRace,
  toCreateRaceRequest,
  toTournamentRequest,
  toUpdateRaceRequest
} from '../adapters/tournamentPersistenceAdapter';
import {
  cancelRace,
  createRace,
  createTournament,
  removeTournamentVenueImage,
  uploadTournamentVenueImage,
  updateRace,
  updateTournament
} from './eventService';

function persistenceError(message, cause, partialTournamentId = null) {
  const error = new Error(`${message}${cause?.message ? ` ${cause.message}` : ''}`);
  error.partialTournamentId = partialTournamentId;
  return error;
}

export async function createTournamentProgramme(draft) {
  const tournament = await createTournament(toTournamentRequest(draft));
  const tournamentId = tournament.tournamentId;

  for (let index = 0; index < draft.races.length; index += 1) {
    const race = draft.races[index];
    try {
      await createRace(toCreateRaceRequest(race, tournamentId, index + 1));
    } catch (error) {
      throw persistenceError(
        `Đã tạo ${draft.name} với mã Tournament #${tournamentId}, nhưng không thể tạo Race ${index + 1} (${race.name}). Tournament đã lưu được tải lại; hãy chỉnh sửa để hoàn tất chương trình Race.`,
        error,
        tournamentId
      );
    }
  }

  if (draft.venueImageFile) {
    try {
      await uploadTournamentVenueImage(tournamentId, draft.venueImageFile);
    } catch (error) {
      throw persistenceError(
        `Đã tạo ${draft.name} và các Race, nhưng không thể tải hình địa điểm lên. Hãy chỉnh sửa Tournament đã lưu để thử tải hình lại.`,
        error,
        tournamentId
      );
    }
  }

  return tournamentId;
}

export async function updateTournamentProgramme(original, draft) {
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
      } else {
        await createRace(toCreateRaceRequest(race, draft.id, nextRaceOrder));
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
