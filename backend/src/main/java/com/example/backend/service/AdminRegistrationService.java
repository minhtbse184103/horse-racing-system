package com.example.backend.service;

import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.dto.request.RejectRegistrationRequest;
import com.example.backend.dto.request.UpdatePaymentStatusRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.entity.*;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class AdminRegistrationService {

        private static final Set<String> REGISTRATION_STATUSES = Set.of(
                        RegistrationStatus.PENDING,
                        RegistrationStatus.APPROVED,
                        RegistrationStatus.REJECTED,
                        RegistrationStatus.CANCELLED);

        private static final Set<String> PAYMENT_STATUSES = Set.of(
                        PaymentStatus.UNPAID,
                        PaymentStatus.PAID,
                        PaymentStatus.REFUNDED,
                        PaymentStatus.FAILED);

        private final RegistrationRepository registrationRepository;
        private final TournamentRepository tournamentRepository;
        private final HorseRepository horseRepository;
        private final UserRepository userRepository;
        private final RaceEntryRepository raceEntryRepository;
        private final RaceRepository raceRepository;
        private final RegistrationEligibilityService eligibilityService;

        public AdminRegistrationService(
                        RegistrationRepository registrationRepository,
                        TournamentRepository tournamentRepository,
                        HorseRepository horseRepository,
                        UserRepository userRepository,
                        RaceEntryRepository raceEntryRepository,
                        RaceRepository raceRepository,
                        RegistrationEligibilityService eligibilityService) {
                this.registrationRepository = registrationRepository;
                this.tournamentRepository = tournamentRepository;
                this.horseRepository = horseRepository;
                this.userRepository = userRepository;
                this.raceEntryRepository = raceEntryRepository;
                this.raceRepository = raceRepository;
                this.eligibilityService = eligibilityService;
        }

        @Transactional(readOnly = true)
        public List<RegistrationResponse> getRegistrations(String status) {
                if (status == null || status.isBlank()) {
                        return registrationRepository
                                        .findAllByOrderBySubmittedAtDesc()
                                        .stream()
                                        .map(this::toResponse)
                                        .toList();
                }

                String normalizedStatus = status.trim().toUpperCase();

                if (!REGISTRATION_STATUSES.contains(normalizedStatus)) {
                        throw new ApiException(
                                        HttpStatus.BAD_REQUEST,
                                        "Unsupported registration status.");
                }

                return registrationRepository
                                .findByApprovalStatusOrderBySubmittedAtDesc(
                                                normalizedStatus)
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public List<RegistrationResponse> getPendingRegistrations() {
                return registrationRepository
                                .findByApprovalStatusOrderBySubmittedAtAsc(
                                                RegistrationStatus.PENDING)
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public List<RegistrationResponse> getRegistrationHistory() {
                return registrationRepository
                                .findByApprovalStatusInOrderByReviewedAtDesc(
                                                List.of(
                                                                RegistrationStatus.APPROVED,
                                                                RegistrationStatus.REJECTED,
                                                                RegistrationStatus.CANCELLED))
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        @Transactional
        public RegistrationResponse approveRegistration(
                        Integer registrationId,
                        String adminEmail) {
                Registration registration = getPendingRegistrationForUpdate(registrationId);

                Tournament tournament = tournamentRepository
                                .findByIdForUpdate(registration.getTournamentId())
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "Tournament does not exist."));

                User admin = getAdmin(adminEmail);

                eligibilityService.validateForApproval(
                                registration,
                                tournament);

                registration.setApprovalStatus(
                                RegistrationStatus.APPROVED);
                registration.setRejectionReason(null);
                registration.setReviewedAt(LocalDateTime.now());
                registration.setReviewedBy(admin.getUserID());

                return toResponse(
                                registrationRepository.save(registration));
        }

        @Transactional
        public RegistrationResponse rejectRegistration(
                        Integer registrationId,
                        RejectRegistrationRequest request,
                        String adminEmail) {
                Registration registration = getPendingRegistrationForUpdate(registrationId);

                User admin = getAdmin(adminEmail);

                registration.setApprovalStatus(
                                RegistrationStatus.REJECTED);
                registration.setRejectionReason(
                                request.getRejectionReason().trim());
                registration.setReviewedAt(LocalDateTime.now());
                registration.setReviewedBy(admin.getUserID());

                return toResponse(
                                registrationRepository.save(registration));
        }

        @Transactional
        public RegistrationResponse updatePaymentStatus(
                        Integer registrationId,
                        UpdatePaymentStatusRequest request,
                        String adminEmail) {
                getAdmin(adminEmail);

                Registration registration = registrationRepository
                                .findByIdForUpdate(registrationId)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "Registration does not exist."));

                String paymentStatus = request.getPaymentStatus().trim().toUpperCase();

                if (!PAYMENT_STATUSES.contains(paymentStatus)) {
                        throw new ApiException(
                                        HttpStatus.BAD_REQUEST,
                                        "Unsupported payment status.");
                }
                if (RegistrationStatus.APPROVED.equals(
                                registration.getApprovalStatus())
                                && !PaymentStatus.PAID.equals(paymentStatus)) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "An approved registration must remain PAID.");
                }
                registration.setPaymentStatus(paymentStatus);

                return toResponse(
                                registrationRepository.save(registration));
        }

        private Registration getPendingRegistrationForUpdate(
                        Integer registrationId) {
                Registration registration = registrationRepository
                                .findByIdForUpdate(registrationId)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "Registration does not exist."));

                if (!RegistrationStatus.PENDING.equals(
                                registration.getApprovalStatus())) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Only PENDING registrations can be reviewed.");
                }

                return registration;
        }

        private User getAdmin(String adminEmail) {
                User admin = userRepository.findByEmail(adminEmail)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.UNAUTHORIZED,
                                                "Authenticated administrator does not exist."));

                if (admin.getRole() == null
                                || !"ADMIN".equalsIgnoreCase(
                                                admin.getRole().getRoleName())) {
                        throw new ApiException(
                                        HttpStatus.FORBIDDEN,
                                        "Only administrators can review registrations.");
                }

                if (!"ACTIVE".equalsIgnoreCase(admin.getStatus())) {
                        throw new ApiException(
                                        HttpStatus.FORBIDDEN,
                                        "Administrator account is not active.");
                }

                return admin;
        }

        private RegistrationResponse toResponse(
                        Registration registration) {
                Tournament tournament = tournamentRepository
                                .findById(registration.getTournamentId())
                                .orElse(null);

                Horse horse = horseRepository
                                .findById(registration.getHorseId())
                                .orElse(null);

                User owner = userRepository
                                .findById(registration.getOwnerId())
                                .orElse(null);

                User jockey = registration.getJockeyId() == null
                                ? null
                                : userRepository
                                                .findById(registration.getJockeyId())
                                                .orElse(null);

                User reviewer = registration.getReviewedBy() == null
                                ? null
                                : userRepository
                                                .findById(registration.getReviewedBy())
                                                .orElse(null);

                RaceEntry raceEntry = raceEntryRepository
                                .findByRegistrationIdAndStatus(
                                                registration.getRegistrationId(),
                                                RaceEntryStatus.ASSIGNED)
                                .orElse(null);

                Race race = raceEntry == null
                                ? null
                                : raceRepository
                                                .findById(raceEntry.getRaceId())
                                                .orElse(null);

                return RegistrationResponse.builder()
                                .registrationId(registration.getRegistrationId())
                                .registrationNo(registration.getRegistrationNo())

                                .tournamentId(registration.getTournamentId())
                                .tournamentName(
                                                tournament != null
                                                                ? tournament.getTournamentName()
                                                                : null)

                                .horseId(registration.getHorseId())
                                .horseName(
                                                horse != null ? horse.getHorseName() : null)
                                .horseBreed(
                                                horse != null ? horse.getBreed() : null)
                                .horseGender(
                                                horse != null ? horse.getGender() : null)
                                .horseDateOfBirth(
                                                horse != null ? horse.getDayOfBirth() : null)
                                .horseWeight(
                                                horse != null ? horse.getWeight() : null)
                                .horseHealthCertExpiry(
                                                horse != null
                                                                ? horse.getHealthCertExpiry()
                                                                : null)
                                .horseStatus(
                                                horse != null ? horse.getStatus() : null)

                                .ownerId(registration.getOwnerId())
                                .ownerName(
                                                owner != null ? owner.getFullName() : null)
                                .ownerEmail(
                                                owner != null ? owner.getEmail() : null)

                                .jockeyId(registration.getJockeyId())
                                .jockeyName(
                                                jockey != null ? jockey.getFullName() : null)
                                .jockeyEmail(
                                                jockey != null ? jockey.getEmail() : null)

                                .paymentStatus(registration.getPaymentStatus())
                                .approvalStatus(registration.getApprovalStatus())
                                .rejectionReason(registration.getRejectionReason())

                                .submittedAt(registration.getSubmittedAt())
                                .reviewedAt(registration.getReviewedAt())
                                .reviewedBy(registration.getReviewedBy())
                                .reviewerName(
                                                reviewer != null
                                                                ? reviewer.getFullName()
                                                                : null)

                                .assigned(raceEntry != null)
                                .assignedRaceId(
                                                race != null ? race.getRaceId() : null)
                                .assignedRaceName(
                                                race != null ? race.getRaceName() : null)

                                .createdAt(registration.getCreatedAt())
                                .updatedAt(registration.getUpdatedAt())
                                .build();
        }

        /*
        private void validateRegistrationForConfirmation(Registration registration) {
                Tournament tournament = getTournamentForUpdate(registration.getTournamentId());
                validateTournament(tournament);

                TournamentCondition condition = getTournamentCondition(tournament.getConditionId());

                User owner = getUser(registration.getOwnerId(), "Owner");
                validateOwner(owner);

                Horse horse = getHorse(registration.getHorseId());
                validateHorse(registration, horse, tournament, condition);

                User jockey = getJockey(registration.getJockeyId());
                JockeyProfile jockeyProfile = getJockeyProfile(registration.getJockeyId());
                validateJockey(registration, jockey, jockeyProfile, condition);

                validateNoDuplicateConfirmedRegistration(registration);
                validateTournamentCapacity(tournament);
        }

        private Tournament getTournamentForUpdate(Integer tournamentId) {
                return tournamentRepository.findByIdForUpdate(tournamentId)
                                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại."));
        }

        private TournamentCondition getTournamentCondition(Integer conditionId) {
                return tournamentConditionRepository.findById(conditionId)
                                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                                                "Điều kiện giải đấu không tồn tại."));
        }

        private Horse getHorse(Integer horseId) {
                return horseRepository.findById(horseId)
                                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));
        }

        private User getUser(Integer userId, String userType) {
                return userRepository.findById(userId)
                                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                                                userType + " không tồn tại."));
        }

        private User getJockey(Integer jockeyId) {
                if (jockeyId == null) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Đơn đăng ký chưa có nài ngựa đã chấp nhận lời mời.");
                }

                return getUser(jockeyId, "Jockey");
        }

        private JockeyProfile getJockeyProfile(Integer jockeyId) {
                return jockeyProfileRepository.findById(jockeyId)
                                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                                                "Hồ sơ nài ngựa không tồn tại."));
        }

        private void validateTournament(Tournament tournament) {
                if (!EventStatus.OPEN_FOR_REGISTRATION.equals(tournament.getStatus())
                                && !EventStatus.CLOSED_REGISTRATION.equals(tournament.getStatus())) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Giải đấu phải đang mở hoặc đã đóng đăng ký.");
                }
        }

        private void validateOwner(User owner) {
                if (!ACTIVE.equals(owner.getStatus())) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Tài khoản chủ ngựa không hoạt động.");
                }
        }

        private void validateHorse(
                        Registration registration,
                        Horse horse,
                        Tournament tournament,
                        TournamentCondition condition) {

                if (!Objects.equals(horse.getOwnerId(), registration.getOwnerId())) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Ngựa không thuộc sở hữu của chủ đơn đăng ký.");
                }

                if (!ACTIVE.equals(horse.getStatus())) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Ngựa không ở trạng thái ACTIVE.");
                }

                if (horse.getHealthCertExpiry() == null
                                || horse.getHealthCertExpiry().isBefore(tournament.getStartDate())) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Giấy chứng nhận sức khỏe của ngựa hết hạn trước khi giải đấu bắt đầu.");
                }

                if (horse.getWeight() == null
                                || horse.getWeight().compareTo(condition.getMaxHorseWeight()) > 0) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Cân nặng của ngựa vượt quá giới hạn của giải đấu.");
                }
        }

        private void validateJockey(
                        Registration registration,
                        User jockey,
                        JockeyProfile jockeyProfile,
                        TournamentCondition condition) {

                if (!Objects.equals(jockey.getUserID(), registration.getJockeyId())) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Nài ngựa trong đơn đăng ký không hợp lệ.");
                }

                if (!ACTIVE.equals(jockey.getStatus())) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Tài khoản nài ngựa không hoạt động.");
                }

                if (jockeyProfile.getWeight() == null
                                || jockeyProfile.getWeight()
                                                .compareTo(condition.getMaxJockeyWeight()) > 0) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Nài ngựa vượt quá giới hạn cân nặng của giải đấu.");
                }
        }

        private void validateTournamentCapacity(Tournament tournament) {
                long confirmedCount = registrationRepository.countByTournamentIdAndStatusIn(
                                tournament.getTournamentId(),
                                List.of(CONFIRMED));

                if (confirmedCount >= tournament.getMaxParticipants()) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Giải đấu đã đạt số người tham gia tối đa.");
                }
        }

        private void validateNoDuplicateConfirmedRegistration(
                        Registration registration) {

                long confirmedHorseCount = registrationRepository
                                .countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                                                registration.getTournamentId(),
                                                registration.getHorseId(),
                                                List.of(CONFIRMED),
                                                registration.getRegistrationId());

                if (confirmedHorseCount > 0) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Ngựa đã có đơn đăng ký được xác nhận trong giải đấu này.");
                }

                long confirmedJockeyCount = registrationRepository
                                .countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                                                registration.getTournamentId(),
                                                registration.getJockeyId(),
                                                List.of(CONFIRMED),
                                                registration.getRegistrationId());

                if (confirmedJockeyCount > 0) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Nài ngựa đã có đơn đăng ký được xác nhận trong giải đấu này.");
                }
        }
        */

}
