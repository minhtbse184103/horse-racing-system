package com.example.backend.service;

import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.dto.response.RaceLineupEntryResponse;
import com.example.backend.dto.response.RaceLineupResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Read-only API consumed by the Unity race engine (authenticated via
 * a per-launch X-Race-Engine-Key token, not JWT) to fetch the
 * lineup for a race it has been launched for. Kept separate from
 * RaceEngineLaunchService because it sits on the Unity-facing side of
 * the trust boundary rather than the admin-facing "Run Race" side.
 */
@Service
public class RaceEngineQueryService {

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RegistrationRepository registrationRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final JockeyProfileRepository jockeyProfileRepository;
    private final RaceEngineTokenService raceEngineTokenService;

    public RaceEngineQueryService(
            RaceRepository raceRepository,
            RaceEntryRepository raceEntryRepository,
            RegistrationRepository registrationRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            JockeyProfileRepository jockeyProfileRepository,
            RaceEngineTokenService raceEngineTokenService
    ) {
        this.raceRepository = raceRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.registrationRepository = registrationRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.raceEngineTokenService = raceEngineTokenService;
    }

    @Transactional(readOnly = true)
    public RaceLineupResponse getLineup(
            Integer raceId,
            String raceEngineToken
    ) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));
        raceEngineTokenService.validateToken(race, raceEngineToken);

        List<RaceEntry> entries = raceEntryRepository
                .findByRaceIdAndStatusOrderByStartingStallAsc(
                        raceId,
                        RaceEntryStatus.ASSIGNED
                );

        Map<Integer, Registration> registrationsById =
                registrationRepository.findAllById(
                                entries.stream()
                                        .map(RaceEntry::getRegistrationId)
                                        .toList()
                        )
                        .stream()
                        .collect(Collectors.toMap(
                                Registration::getRegistrationId,
                                Function.identity()
                        ));

        Map<Integer, Horse> horsesById =
                horseRepository.findAllById(
                                registrationsById.values().stream()
                                        .map(Registration::getHorseId)
                                        .toList()
                        )
                        .stream()
                        .collect(Collectors.toMap(
                                Horse::getHorseId,
                                Function.identity()
                        ));

        Map<Integer, User> jockeysById =
                userRepository.findAllById(
                                registrationsById.values().stream()
                                        .map(Registration::getJockeyId)
                                        .filter(Objects::nonNull)
                                        .toList()
                        )
                        .stream()
                        .collect(Collectors.toMap(
                                User::getUserID,
                                Function.identity()
                        ));

        Map<Integer, JockeyProfile> jockeyProfilesById =
                jockeyProfileRepository.findByJockeyIdIn(jockeysById.keySet())
                        .stream()
                        .collect(Collectors.toMap(
                                JockeyProfile::getJockeyId,
                                Function.identity()
                        ));

        List<RaceLineupEntryResponse> runners = entries.stream()
                .map(entry -> {
                    Registration registration =
                            registrationsById.get(entry.getRegistrationId());
                    Horse horse = registration == null
                            ? null
                            : horsesById.get(registration.getHorseId());
                    User jockey = registration == null
                            || registration.getJockeyId() == null
                            ? null
                            : jockeysById.get(registration.getJockeyId());

                    return RaceLineupEntryResponse.builder()
                            .horseId(entry.getStartingStall())
                            .startingStall(entry.getStartingStall())
                            .horseName(
                                    horse != null ? horse.getHorseName() : null
                            )
                            .jockeyName(
                                    getJockeyDisplayName(
                                            jockey,
                                            jockeyProfilesById
                                    )
                            )
                            .build();
                })
                .toList();

        return RaceLineupResponse.builder()
                .raceId(race.getRaceId())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .distance(race.getDistance())
                .status(race.getStatus())
                .runners(runners)
                .build();
    }

    private String getJockeyDisplayName(
            User jockey,
            Map<Integer, JockeyProfile> jockeyProfilesById
    ) {
        if (jockey == null) {
            return null;
        }

        JockeyProfile profile = jockeyProfilesById.get(jockey.getUserID());
        if (profile != null
                && profile.getFullName() != null
                && !profile.getFullName().isBlank()) {
            return profile.getFullName();
        }

        return jockey.getUsername();
    }
}
