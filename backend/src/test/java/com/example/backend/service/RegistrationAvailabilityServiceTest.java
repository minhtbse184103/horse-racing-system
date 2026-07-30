package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.RegistrationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationAvailabilityServiceTest {

    @Mock private RegistrationRepository registrationRepository;
    @Mock private JockeyInvitationRepository jockeyInvitationRepository;

    private RegistrationAvailabilityService service;

    @BeforeEach
    void setUp() {
        service = new RegistrationAvailabilityService(
                registrationRepository,
                jockeyInvitationRepository
        );
    }

    @Test
    void approvalRejectsDuplicateOwnerInSameTournament() {
        Registration registration = approvalCandidate();
        Tournament tournament = tournament();

        when(registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                eq(10),
                eq(30),
                eq(List.of(RegistrationStatus.APPROVED)),
                eq(99)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateRegistrationCanBeApproved(registration, tournament)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Owner already has an approved registration in this tournament.",
                exception.getMessage()
        );
    }

    @Test
    void approvalRejectsDuplicateJockeyInSameTournament() {
        Registration registration = approvalCandidate();
        Tournament tournament = tournament();

        when(registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                eq(10),
                eq(40),
                eq(List.of(RegistrationStatus.APPROVED)),
                eq(99)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateRegistrationCanBeApproved(registration, tournament)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Jockey already has an approved registration in this tournament.",
                exception.getMessage()
        );
    }

    @Test
    void approvalRejectsHorseConflictInUnfinishedTournament() {
        Registration registration = approvalCandidate();
        Tournament tournament = tournament();

        when(registrationRepository.countByActiveTournamentAndHorseIdAndStatusInExcludingRegistration(
                eq(20),
                eq(List.of(RegistrationStatus.APPROVED)),
                eq(blockingTournamentStatuses()),
                eq(99)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateRegistrationCanBeApproved(registration, tournament)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Horse already has an approved registration in an unfinished tournament.",
                exception.getMessage()
        );
    }

    @Test
    void approvalRejectsJockeyConflictInUnfinishedTournament() {
        Registration registration = approvalCandidate();
        Tournament tournament = tournament();

        when(registrationRepository.countByActiveTournamentAndJockeyIdAndStatusInExcludingRegistration(
                eq(40),
                eq(List.of(RegistrationStatus.APPROVED)),
                eq(blockingTournamentStatuses()),
                eq(99)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateRegistrationCanBeApproved(registration, tournament)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Jockey already has an approved registration in an unfinished tournament.",
                exception.getMessage()
        );
    }

    @Test
    void approvalRejectsHorseJockeyPairConflictInUnfinishedTournament() {
        Registration registration = approvalCandidate();
        Tournament tournament = tournament();

        when(registrationRepository.countByActiveTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
                eq(20),
                eq(40),
                eq(List.of(RegistrationStatus.APPROVED)),
                eq(blockingTournamentStatuses()),
                eq(99)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateRegistrationCanBeApproved(registration, tournament)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Horse and jockey already have an approved registration in an unfinished tournament.",
                exception.getMessage()
        );
    }

    @Test
    void invitationRemainsBlockedWhilePreviousRegistrationAwaitsRefund() {
        Tournament tournament = tournament();
        when(registrationRepository.countByTournamentIdAndOwnerIdAndApprovalStatusAndPaymentStatus(
                10,
                30,
                RegistrationStatus.REJECTED,
                PaymentStatus.REFUND_PENDING
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateInvitationCanBeCreated(30, 20, 40, tournament, null)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    }

    private Registration approvalCandidate() {
        Registration registration = new Registration();
        registration.setRegistrationId(99);
        registration.setTournamentId(10);
        registration.setHorseId(20);
        registration.setOwnerId(30);
        registration.setJockeyId(40);
        return registration;
    }

    private Tournament tournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(10);
        return tournament;
    }

    private List<String> blockingTournamentStatuses() {
        return List.of(
                EventStatus.OPEN_FOR_REGISTRATION,
                EventStatus.REGISTRATION_CLOSED,
                EventStatus.ENTRIES_FINALIZED,
                EventStatus.READY,
                EventStatus.IN_PROGRESS,
                EventStatus.PENDING_REVIEW
        );
    }
}
