package com.example.backend.service;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.backend.dto.request.CreateRegistrationRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceCategory;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RaceCategoryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;

@Service
public class RegistrationService {
    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RaceCategoryRepository raceCategoryRepository;

    /**
     * Register a horse for a race
     * BR-21: A horse cannot be registered twice in the same race
     */
    public RegistrationResponse registerHorse(User owner, CreateRegistrationRequest request) {
        // Verify owner owns this horse
        Horse horse = horseRepository.findByHorseIDAndOwner(request.getHorseID(), owner)
                .orElseThrow(() -> new ApiException("Horse not found or not owned by you"));

        // Get race
        Race race = raceRepository.findById(request.getRaceID())
                .orElseThrow(() -> new ApiException("Race not found"));

        // BR-21: Check if horse already registered in this race
        if (registrationRepository.findByRaceAndHorse(race, horse).isPresent()) {
            throw new ApiException("This horse is already registered in this race");
        }

        // BR-07: Horse must be approved before registration
        if (!"APPROVED".equals(horse.getStatus())) {
            throw new ApiException("Horse must be APPROVED to register");
        }

        // BR-09: Horse needs a valid health certificate and valid category weight.
        if (horse.getHealthCertExpiry() == null || horse.getHealthCertExpiry().isBefore(LocalDate.now())) {
            throw new ApiException("Horse must have a valid health certificate");
        }

        RaceCategory category = raceCategoryRepository.findById(race.getCategoryId())
                .orElseThrow(() -> new ApiException("Race category not found"));
        if (horse.getWeight() == null) {
            throw new ApiException("Horse weight is required to register");
        }
        if (category.getMaxHorseWeight() != null
                && BigDecimal.valueOf(horse.getWeight()).compareTo(category.getMaxHorseWeight()) > 0) {
            throw new ApiException("Horse weight exceeds race category limit");
        }

        if (race.getMaxParticipants() != null
                && registrationRepository.countByRace(race) >= race.getMaxParticipants()) {
            throw new ApiException("Race has reached maximum participants");
        }

        Registration registration = new Registration();
        registration.setRace(race);
        registration.setHorse(horse);
        registration.setOwner(owner);
        registration.setStatus("PENDING");
        registration.setRegisteredAt(LocalDateTime.now());

        Registration saved = registrationRepository.save(registration);
        return toResponse(saved);
    }

    /**
     * Get all registrations by owner
     */
    public List<RegistrationResponse> getOwnerRegistrations(User owner) {
        List<Registration> registrations = registrationRepository.findByOwner(owner);
        return registrations.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Get all registrations for a specific race
     */
    public List<RegistrationResponse> getRaceRegistrations(Integer raceID) {
        Race race = raceRepository.findById(raceID)
                .orElseThrow(() -> new ApiException("Race not found"));
        List<Registration> registrations = registrationRepository.findByRace(race);
        return registrations.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Approve a registration (admin only)
     */
    public RegistrationResponse approveRegistration(Integer regID) {
        Registration registration = registrationRepository.findById(regID)
                .orElseThrow(() -> new ApiException("Registration not found"));
        registration.setStatus("APPROVED");
        Registration updated = registrationRepository.save(registration);
        return toResponse(updated);
    }

    /**
     * Reject a registration (admin only)
     */
    public RegistrationResponse rejectRegistration(Integer regID) {
        Registration registration = registrationRepository.findById(regID)
                .orElseThrow(() -> new ApiException("Registration not found"));
        registration.setStatus("REJECTED");
        Registration updated = registrationRepository.save(registration);
        return toResponse(updated);
    }

    private RegistrationResponse toResponse(Registration registration) {
        return new RegistrationResponse(
                registration.getRegID(),
                registration.getRace().getRaceId(),
                registration.getHorse().getHorseID(),
                registration.getHorse().getName(),
                registration.getOwner().getUserID(),
                registration.getStatus(),
                registration.getRegisteredAt(),
                null
        );
    }
}
