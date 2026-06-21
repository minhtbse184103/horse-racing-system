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
        `${draft.name} was created as tournament #${tournamentId}, but race ${index + 1} (${race.name}) could not be created. The saved tournament has been reloaded; edit it to finish the race programme.`,
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
        `${draft.name} and its races were created, but the venue image could not be uploaded. Edit the saved tournament to retry the image upload.`,
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
        `${draft.name} was updated, but race ${race.name} could not be synchronized. Reload the tournament before retrying.`,
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
          `${draft.name} was updated, but removed race ${race.name} could not be cancelled. Reload the tournament before retrying.`,
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
      `${draft.name} and its races were saved, but the venue image change could not be completed. Reload the tournament before retrying.`,
      error
    );
  }

  return draft.id;
}
