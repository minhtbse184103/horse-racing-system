package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistrationAvailabilityService {

    private static final String INVITATION_PENDING = "PENDING";
    private static final List<String> ACTIVE_REGISTRATION_STATUSES = List.of(
            RegistrationStatus.PENDING,
            RegistrationStatus.APPROVED
    );
    private static final List<String> BLOCKING_TOURNAMENT_STATUSES = List.of(
            EventStatus.OPEN_FOR_REGISTRATION,
            EventStatus.REGISTRATION_CLOSED,
            EventStatus.ENTRIES_FINALIZED,
            EventStatus.READY,
            EventStatus.IN_PROGRESS,
            EventStatus.PENDING_REVIEW
    );

    private final RegistrationRepository registrationRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;

    public RegistrationAvailabilityService(
            RegistrationRepository registrationRepository,
            JockeyInvitationRepository jockeyInvitationRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
    }

    public void validateInvitationCanBeCreated(
            Integer ownerId,
            Integer horseId,
            Integer jockeyId,
            Tournament tournament,
            Integer excludedInvitationId
    ) {
        validateOwnerForInvitation(ownerId, tournament.getTournamentId(), excludedInvitationId);

        validateHorseActiveTournamentAvailability(horseId, null, excludedInvitationId);

        validateJockeyActiveTournamentAvailability(jockeyId, null, excludedInvitationId);
    }

    public void validateAcceptedInvitationCanCreateRegistration(
            Integer ownerId,
            Integer horseId,
            Integer jockeyId,
            Tournament tournament,
            Integer excludedInvitationId
    ) {
        validateOwnerForInvitation(ownerId, tournament.getTournamentId(), excludedInvitationId);
        validateHorseSameTournament(horseId, tournament.getTournamentId(), null);
        validateHorseActiveTournamentAvailability(horseId, null, excludedInvitationId);
        validateJockeySameTournament(jockeyId, tournament.getTournamentId(), null);
        validateJockeyActiveTournamentAvailability(jockeyId, null, excludedInvitationId);
    }

    public void validateOwnerRegistrationCanBeCreated(
            Tournament tournament,
            Horse horse,
            User owner,
            User jockey
    ) {
        validateHorseSameTournamentForOwnerRegistration(horse.getHorseId(), tournament.getTournamentId());
        validateOwnerSameTournamentForOwnerRegistration(owner.getUserID(), tournament.getTournamentId());
        validateHorseRegistrationAvailabilityForOwnerRegistration(horse.getHorseId());
        validateJockeyRegistrationAvailabilityForOwnerRegistration(jockey.getUserID(), tournament);
    }

    public void validateRegistrationCanBeApproved(
            Registration registration,
            Tournament tournament
    ) {
        List<String> approvedStatuses = List.of(RegistrationStatus.APPROVED);
        Integer excludedRegistrationId = registration.getRegistrationId();

        long ownerSameTournamentCount =
                registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                        tournament.getTournamentId(),
                        registration.getOwnerId(),
                        approvedStatuses,
                        excludedRegistrationId);
        if (ownerSameTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Owner already has an approved registration in this tournament.");
        }

        if (registration.getJockeyId() != null) {
            long jockeySameTournamentCount =
                    registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                            tournament.getTournamentId(),
                            registration.getJockeyId(),
                            approvedStatuses,
                            excludedRegistrationId);
            if (jockeySameTournamentCount > 0) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Jockey already has an approved registration in this tournament.");
            }
        }

        long activeHorseTournamentCount =
                registrationRepository.countByActiveTournamentAndHorseIdAndStatusInExcludingRegistration(
                        registration.getHorseId(),
                        approvedStatuses,
                        BLOCKING_TOURNAMENT_STATUSES,
                        excludedRegistrationId);
        if (activeHorseTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse already has an approved registration in an unfinished tournament.");
        }

        if (registration.getJockeyId() == null) {
            return;
        }

        long activeJockeyTournamentCount =
                registrationRepository.countByActiveTournamentAndJockeyIdAndStatusInExcludingRegistration(
                        registration.getJockeyId(),
                        approvedStatuses,
                        BLOCKING_TOURNAMENT_STATUSES,
                        excludedRegistrationId);
        if (activeJockeyTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Jockey already has an approved registration in an unfinished tournament.");
        }

        long activeHorseJockeyTournamentCount =
                registrationRepository.countByActiveTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
                        registration.getHorseId(),
                        registration.getJockeyId(),
                        approvedStatuses,
                        BLOCKING_TOURNAMENT_STATUSES,
                        excludedRegistrationId);
        if (activeHorseJockeyTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse and jockey already have an approved registration in an unfinished tournament.");
        }
    }

    private void validateOwnerForInvitation(
            Integer ownerId,
            Integer tournamentId,
            Integer excludedInvitationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                tournamentId,
                ownerId,
                ACTIVE_REGISTRATION_STATUSES,
                null);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chủ ngựa đã có một đơn đăng ký đang hoạt động trong giải đấu này.");
        }

        long refundsPending = registrationRepository
                .countByTournamentIdAndOwnerIdAndApprovalStatusAndPaymentStatus(
                        tournamentId,
                        ownerId,
                        RegistrationStatus.REJECTED,
                        PaymentStatus.REFUND_PENDING
                );
        if (refundsPending > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Registration cũ đang chờ hoàn tiền. Owner chỉ được đăng ký lại sau khi Admin xác nhận hoàn tiền.");
        }

        if (jockeyInvitationRepository.existsPendingInvitationForTournamentAndOwner(
                tournamentId,
                ownerId,
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chủ ngựa đã có một lời mời đang chờ xử lý trong giải đấu này.");
        }
    }

    private void validateHorseSameTournament(
            Integer horseId,
            Integer tournamentId,
            Integer excludedRegistrationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                tournamentId,
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    private void validateJockeySameTournament(
            Integer jockeyId,
            Integer tournamentId,
            Integer excludedRegistrationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournamentId,
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    private void validateHorseActiveTournamentAvailability(
            Integer horseId,
            Integer excludedRegistrationId,
            Integer excludedInvitationId
    ) {
        long activeTournamentRegistrations = registrationRepository.countByActiveTournamentAndHorseIdAndStatusInExcludingRegistration(
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                BLOCKING_TOURNAMENT_STATUSES,
                excludedRegistrationId);
        if (activeTournamentRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đang có đơn đăng ký ở một giải đấu chưa kết thúc.");
        }
        if (registrationRepository.countRefundPendingByHorseInBlockingTournament(
                horseId,
                RegistrationStatus.REJECTED,
                PaymentStatus.REFUND_PENDING,
                BLOCKING_TOURNAMENT_STATUSES) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Registration của ngựa đang chờ hoàn tiền.");
        }
        if (jockeyInvitationRepository.existsPendingInvitationInActiveTournamentForHorse(
                horseId,
                INVITATION_PENDING,
                BLOCKING_TOURNAMENT_STATUSES,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đang có lời mời chờ xử lý ở một giải đấu chưa kết thúc.");
        }
    }

    private void validateJockeyActiveTournamentAvailability(
            Integer jockeyId,
            Integer excludedRegistrationId,
            Integer excludedInvitationId
    ) {
        long activeTournamentRegistrations = registrationRepository.countByActiveTournamentAndJockeyIdAndStatusInExcludingRegistration(
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                BLOCKING_TOURNAMENT_STATUSES,
                excludedRegistrationId);
        if (activeTournamentRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đang có đơn đăng ký ở một giải đấu chưa kết thúc.");
        }

        if (registrationRepository.countRefundPendingByJockeyInBlockingTournament(
                jockeyId,
                RegistrationStatus.REJECTED,
                PaymentStatus.REFUND_PENDING,
                BLOCKING_TOURNAMENT_STATUSES) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Registration của nài ngựa đang chờ hoàn tiền.");
        }

        if (jockeyInvitationRepository.existsPendingInvitationInActiveTournamentForJockey(
                jockeyId,
                INVITATION_PENDING,
                BLOCKING_TOURNAMENT_STATUSES,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đang có lời mời chờ xử lý ở một giải đấu chưa kết thúc.");
        }
    }

    private void validateHorseSameTournamentForOwnerRegistration(
            Integer horseId,
            Integer tournamentId
    ) {
        long duplicateCount = registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                tournamentId,
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (duplicateCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse already has an active registration in this tournament.");
        }
    }

    private void validateOwnerSameTournamentForOwnerRegistration(
            Integer ownerId,
            Integer tournamentId
    ) {
        long duplicateCount = registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                tournamentId,
                ownerId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (duplicateCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Owner already has an active registration in this tournament.");
        }

        if (registrationRepository.countByTournamentIdAndOwnerIdAndApprovalStatusAndPaymentStatus(
                tournamentId,
                ownerId,
                RegistrationStatus.REJECTED,
                PaymentStatus.REFUND_PENDING) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Registration cũ đang chờ hoàn tiền. Owner chỉ được đăng ký lại sau khi Admin xác nhận hoàn tiền.");
        }
    }

    private void validateHorseRegistrationAvailabilityForOwnerRegistration(Integer horseId) {
        long activeTournamentCount = registrationRepository.countByActiveTournamentAndHorseIdAndStatusInExcludingRegistration(
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                BLOCKING_TOURNAMENT_STATUSES,
                null);

        if (activeTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse already has an active registration in an unfinished tournament.");
        }

        if (registrationRepository.countRefundPendingByHorseInBlockingTournament(
                horseId,
                RegistrationStatus.REJECTED,
                PaymentStatus.REFUND_PENDING,
                BLOCKING_TOURNAMENT_STATUSES) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Registration của ngựa đang chờ hoàn tiền.");
        }
    }

    private void validateJockeyRegistrationAvailabilityForOwnerRegistration(
            Integer jockeyId,
            Tournament tournament
    ) {
        long sameTournamentCount = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournament.getTournamentId(),
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (sameTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Jockey already has an active registration in this tournament.");
        }

        long activeTournamentCount = registrationRepository.countByActiveTournamentAndJockeyIdAndStatusInExcludingRegistration(
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                BLOCKING_TOURNAMENT_STATUSES,
                null);

        if (activeTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Jockey already has an active registration in an unfinished tournament.");
        }

        if (registrationRepository.countRefundPendingByJockeyInBlockingTournament(
                jockeyId,
                RegistrationStatus.REJECTED,
                PaymentStatus.REFUND_PENDING,
                BLOCKING_TOURNAMENT_STATUSES) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Registration của nài ngựa đang chờ hoàn tiền.");
        }
    }
}
