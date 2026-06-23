package com.example.backend.service;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.response.HorseResponse;
import com.example.backend.entity.Horse;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RegistrationRepository;

@Service
public class AdminHorseService {
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String REGISTRATION_ACCEPTED = "ACCEPTED";
    private static final String REGISTRATION_CONFIRMED = "CONFIRMED";

    private final HorseRepository horseRepository;
    private final RegistrationRepository registrationRepository;

    public AdminHorseService(
            HorseRepository horseRepository,
            RegistrationRepository registrationRepository) {
        this.horseRepository = horseRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public List<HorseResponse> getHorses() {
        return horseRepository.findAll()
                .stream()
                .map(this::mapHorseToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HorseResponse> getPendingHorses() {
        return horseRepository.findByStatus(STATUS_PENDING)
                .stream()
                .map(this::mapHorseToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HorseResponse getHorseById(Integer horseId) {
        return horseRepository.findById(horseId)
                .map(this::mapHorseToResponse)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngá»±a khĂ´ng tá»“n táº¡i."));
    }

    @Transactional
    public HorseResponse approveHorse(Integer horseId) {
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));

        if (!STATUS_PENDING.equals(horse.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể phê duyệt ngựa đang ở trạng thái PENDING.");
        }

        if (horse.getHealthCertExpiry() == null || horse.getHealthCertExpiry().isBefore(LocalDate.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Giấy chứng nhận sức khỏe của ngựa phải còn hiệu lực trước khi phê duyệt.");
        }

        if (!hasText(horse.getHealthCertificateUrl()) || !hasText(horse.getOfficialHorseProfileUrl())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Ảnh minh chứng của ngựa là bắt buộc trước khi phê duyệt.");
        }

        horse.setStatus(STATUS_ACTIVE);
        horse.setRejectionReason(null);
        return mapHorseToResponse(horseRepository.save(horse));
    }

    @Transactional
    public HorseResponse rejectHorse(Integer horseId, String feedback) {
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));

        if (!STATUS_PENDING.equals(horse.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể từ chối ngựa đang ở trạng thái PENDING.");
        }

        horse.setStatus(STATUS_REJECTED);
        horse.setRejectionReason(feedback.trim());
        return mapHorseToResponse(horseRepository.save(horse));
    }

    private HorseResponse mapHorseToResponse(Horse horse) {
        List<Integer> registrationIds = registrationRepository.findRegistrationIdsByHorseId(horse.getHorseId());
        return HorseResponse.builder()
                .horseId(horse.getHorseId())
                .ownerId(horse.getOwnerId())
                .horseName(horse.getHorseName())
                .age(horse.getAge())
                .weight(horse.getWeight())
                .colour(horse.getColour())
                .sex(horse.getSex())
                .breeding(horse.getBreeding())
                .trainer(horse.getTrainer())
                .healthCertExpiry(horse.getHealthCertExpiry())
                .healthCertificateUrl(horse.getHealthCertificateUrl())
                .officialHorseProfileUrl(horse.getOfficialHorseProfileUrl())
                .status(horse.getStatus())
                .rejectionReason(horse.getRejectionReason())
                .createdAt(horse.getCreatedAt())
                .updatedAt(horse.getUpdatedAt())
                .registrationCount(registrationIds.size())
                .participated(hasActiveRegistration(registrationIds))
                .build();
    }

    private boolean hasActiveRegistration(Collection<Integer> registrationIds) {
        return !registrationIds.isEmpty()
                && registrationRepository.countByRegistrationIdInAndStatusIn(
                registrationIds,
                List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED)) > 0;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
