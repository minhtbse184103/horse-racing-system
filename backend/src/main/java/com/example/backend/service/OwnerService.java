package com.example.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RegistrationRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class OwnerService {
    private final HorseRepository horseRepository;
    private final RegistrationRepository registrationRepository;

    @Transactional
    public HorseResponse createHorse(User owner, CreateHorseRequest request) {
        validateOwner(owner);

        Horse horse = new Horse();
        horse.setOwner(owner);
        horse.setName(request.getName().trim());
        horse.setBreed(normalize(request.getBreed()));
        horse.setAge(request.getAge());
        horse.setWeight(request.getWeight());
        horse.setHealthCertExpiry(request.getHealthCertExpiry());
        horse.setStatus("PENDING");

        return toResponse(horseRepository.save(horse));
    }

    @Transactional(readOnly = true)
    public List<HorseResponse> getOwnerHorses(User owner) {
        validateOwner(owner);
        return horseRepository.findByOwner(owner)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HorseResponse getHorse(Integer horseID, User owner) {
        validateOwner(owner);
        return toResponse(findOwnedHorse(horseID, owner));
    }

    @Transactional
    public HorseResponse updateHorse(Integer horseID, User owner, UpdateHorseRequest request) {
        validateOwner(owner);
        Horse horse = findOwnedHorse(horseID, owner);

        if (hasText(request.getName())) {
            horse.setName(request.getName().trim());
        }
        if (request.getBreed() != null) {
            horse.setBreed(normalize(request.getBreed()));
        }
        if (request.getAge() != null) {
            if (request.getAge() <= 0) {
                throw new ApiException("Age must be positive");
            }
            horse.setAge(request.getAge());
        }
        if (request.getWeight() != null) {
            if (request.getWeight() <= 0) {
                throw new ApiException("Weight must be positive");
            }
            horse.setWeight(request.getWeight());
        }
        if (request.getHealthCertExpiry() != null) {
            horse.setHealthCertExpiry(request.getHealthCertExpiry());
        }

        if (request.getStatus() != null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Owner cannot update horse approval status");
        }

        return toResponse(horseRepository.save(horse));
    }

    @Transactional
    public void deleteHorse(Integer horseID, User owner) {
        validateOwner(owner);
        Horse horse = findOwnedHorse(horseID, owner);

        if (!registrationRepository.findByHorse(horse).isEmpty()) {
            throw new ApiException("Cannot delete a horse that has registrations");
        }

        horseRepository.delete(horse);
    }

    private Horse findOwnedHorse(Integer horseID, User owner) {
        return horseRepository.findByHorseIDAndOwner(horseID, owner)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Horse not found or not owned by you"));
    }

    private void validateOwner(User owner) {
        if (owner == null || owner.getRole() == null || !"OWNER".equals(owner.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only OWNER users can manage horses");
        }
        if ("SUSPENDED".equals(owner.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Suspended users cannot use the system");
        }
    }

    private String normalize(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private HorseResponse toResponse(Horse horse) {
        return new HorseResponse(
                horse.getHorseID(),
                horse.getName(),
                horse.getBreed(),
                horse.getAge(),
                horse.getWeight(),
                horse.getHealthCertExpiry(),
                horse.getStatus());
    }
}
