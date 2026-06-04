package com.example.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.dto.response.OwnerDashboardResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;

@Service
public class OwnerService {
    private final HorseRepository horseRepository;
    private final RegistrationRepository registrationRepository;
    private final RaceResultRepository raceResultRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;
    private final UserRepository userRepository;

    public OwnerService(
            HorseRepository horseRepository,
            RegistrationRepository registrationRepository,
            RaceResultRepository raceResultRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            UserRepository userRepository) {
        this.horseRepository = horseRepository;
        this.registrationRepository = registrationRepository;
        this.raceResultRepository = raceResultRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public OwnerDashboardResponse getDashboard() {
        User owner = getCurrentOwner();
        Integer ownerId = owner.getUserID();
        List<Horse> horses = horseRepository.findByOwnerId(ownerId);

        long participatedHorses = horses.stream()
                .filter(horse -> hasParticipated(horse.getHorseId()))
                .count();

        return OwnerDashboardResponse.builder()
                .ownerId(ownerId)
                .ownerName(owner.getFullName())
                .totalHorses(horseRepository.countByOwnerId(ownerId))
                .totalRegistrations(registrationRepository.countByOwnerId(ownerId))
                .registeredHorses(registrationRepository.countRegisteredHorsesByOwnerId(ownerId))
                .participatedHorses(participatedHorses)
                .build();
    }

    @Transactional(readOnly = true)
    public List<HorseResponse> getMyHorses() {
        Integer ownerId = getCurrentOwner().getUserID();
        return horseRepository.findByOwnerId(ownerId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HorseResponse getMyHorseById(Integer horseId) {
        Horse horse = getOwnedHorse(horseId);
        return mapToResponse(horse);
    }

    @Transactional
    public HorseResponse createHorse(CreateHorseRequest request) {
        Integer ownerId = getCurrentOwner().getUserID();
        Horse horse = Horse.builder()
                .ownerId(ownerId)
                .name(request.getName())
                .breed(request.getBreed())
                .gender(request.getGender())
                .age(request.getAge())
                .weight(request.getWeight())
                .healthCertExpiry(request.getHealthCertExpiry())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        return mapToResponse(horseRepository.save(horse));
    }

    @Transactional
    public HorseResponse updateHorse(Integer horseId, UpdateHorseRequest request) {
        Horse horse = getOwnedHorse(horseId);
        horse.setName(request.getName());
        horse.setBreed(request.getBreed());
        horse.setGender(request.getGender());
        horse.setAge(request.getAge());
        horse.setWeight(request.getWeight());
        horse.setHealthCertExpiry(request.getHealthCertExpiry());
        horse.setStatus(request.getStatus());

        return mapToResponse(horseRepository.save(horse));
    }

    @Transactional
    public void deleteHorse(Integer horseId) {
        Horse horse = getOwnedHorse(horseId);
        List<Integer> regIds = registrationRepository.findRegIdsByHorseId(horse.getHorseId());

        if (!regIds.isEmpty() && raceResultRepository.existsByRegIdIn(regIds)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse has participated in at least one race and cannot be deleted.");
        }

        if (!regIds.isEmpty()) {
            jockeyInvitationRepository.deleteByRegIdIn(regIds);
            registrationRepository.deleteByHorseId(horse.getHorseId());
        }

        horseRepository.delete(horse);
    }

    private User getCurrentOwner() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "User is not authenticated.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Owner does not exist."));

        if (user.getRole() == null || !"OWNER".equals(user.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only owners can access this resource.");
        }

        return user;
    }

    private Horse getOwnedHorse(Integer horseId) {
        Integer ownerId = getCurrentOwner().getUserID();
        return horseRepository.findByHorseIdAndOwnerId(horseId, ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Horse does not exist."));
    }

    private HorseResponse mapToResponse(Horse horse) {
        List<Integer> regIds = registrationRepository.findRegIdsByHorseId(horse.getHorseId());
        return HorseResponse.builder()
                .horseId(horse.getHorseId())
                .ownerId(horse.getOwnerId())
                .name(horse.getName())
                .breed(horse.getBreed())
                .gender(horse.getGender())
                .age(horse.getAge())
                .weight(horse.getWeight())
                .healthCertExpiry(horse.getHealthCertExpiry())
                .status(horse.getStatus())
                .registrationCount(regIds.size())
                .participated(!regIds.isEmpty() && raceResultRepository.existsByRegIdIn(regIds))
                .build();
    }

    private boolean hasParticipated(Integer horseId) {
        List<Integer> regIds = registrationRepository.findRegIdsByHorseId(horseId);
        return !regIds.isEmpty() && raceResultRepository.existsByRegIdIn(regIds);
    }
}
