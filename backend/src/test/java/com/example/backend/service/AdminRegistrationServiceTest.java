package com.example.backend.service;

import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.RejectRegistrationRequest;
import com.example.backend.dto.request.UpdatePaymentStatusRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminRegistrationServiceTest {

    @Mock private RegistrationRepository registrationRepository;
    @Mock private TournamentRepository tournamentRepository;
    @Mock private HorseRepository horseRepository;
    @Mock private UserRepository userRepository;
    @Mock private RaceEntryRepository raceEntryRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private RegistrationEligibilityService eligibilityService;

    private AdminRegistrationService service;

    @BeforeEach
    void setUp() {
        service = new AdminRegistrationService(
                registrationRepository,
                tournamentRepository,
                horseRepository,
                userRepository,
                raceEntryRepository,
                raceRepository,
                eligibilityService
        );
    }

    @Test
    void getPendingRegistrationsUsesPendingApprovalStatus() {
        Registration registration = pendingRegistration();
        when(registrationRepository.findByApprovalStatusOrderBySubmittedAtAsc(
                RegistrationStatus.PENDING
        )).thenReturn(List.of(registration));
        stubResponseLookups(registration);

        List<RegistrationResponse> result = service.getPendingRegistrations();

        assertEquals(1, result.size());
        assertEquals(RegistrationStatus.PENDING,
                result.getFirst().getApprovalStatus());
    }

    @Test
    void getRegistrationsRejectsUnsupportedStatus() {
        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getRegistrations("CONFIRMED")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(registrationRepository, never())
                .findByApprovalStatusOrderBySubmittedAtDesc(any());
    }

    @Test
    void approveRegistrationSetsApprovalAuditFields() {
        Registration registration = pendingRegistration();
        Tournament tournament = tournament();
        User admin = activeAdmin();
        when(registrationRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(registration));
        when(tournamentRepository.findByIdForUpdate(10))
                .thenReturn(Optional.of(tournament));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(admin));
        when(registrationRepository.save(registration)).thenReturn(registration);
        stubResponseLookups(registration);

        RegistrationResponse response = service.approveRegistration(
                1,
                "admin@example.com"
        );

        assertEquals(RegistrationStatus.APPROVED,
                registration.getApprovalStatus());
        assertEquals(99, registration.getReviewedBy());
        assertNotNull(registration.getReviewedAt());
        assertEquals(RegistrationStatus.APPROVED,
                response.getApprovalStatus());
        verify(eligibilityService).validateForApproval(registration, tournament);
    }

    @Test
    void approveRegistrationRejectsNonPendingRegistration() {
        Registration registration = pendingRegistration();
        registration.setApprovalStatus(RegistrationStatus.APPROVED);
        when(registrationRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(registration));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.approveRegistration(1, "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void rejectRegistrationTrimsReasonAndSetsAuditFields() {
        Registration registration = pendingRegistration();
        User admin = activeAdmin();
        RejectRegistrationRequest request = new RejectRegistrationRequest();
        request.setRejectionReason("  Invalid health certificate  ");
        when(registrationRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(registration));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(admin));
        when(registrationRepository.save(registration)).thenReturn(registration);
        stubResponseLookups(registration);

        RegistrationResponse response = service.rejectRegistration(
                1,
                request,
                "admin@example.com"
        );

        assertEquals(RegistrationStatus.REJECTED,
                registration.getApprovalStatus());
        assertEquals("Invalid health certificate",
                registration.getRejectionReason());
        assertEquals(99, registration.getReviewedBy());
        assertEquals(RegistrationStatus.REJECTED,
                response.getApprovalStatus());
    }

    @Test
    void updatePaymentStatusNormalizesAndSavesStatus() {
        Registration registration = pendingRegistration();
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest();
        request.setPaymentStatus(" paid ");
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(registrationRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(registration));
        when(registrationRepository.save(registration)).thenReturn(registration);
        stubResponseLookups(registration);

        RegistrationResponse response = service.updatePaymentStatus(
                1, request, "admin@example.com"
        );

        assertEquals(PaymentStatus.PAID, registration.getPaymentStatus());
        assertEquals(PaymentStatus.PAID, response.getPaymentStatus());
    }

    @Test
    void approvedRegistrationMustRemainPaid() {
        Registration registration = pendingRegistration();
        registration.setApprovalStatus(RegistrationStatus.APPROVED);
        registration.setPaymentStatus(PaymentStatus.PAID);
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest();
        request.setPaymentStatus(PaymentStatus.REFUNDED);
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(registrationRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(registration));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.updatePaymentStatus(1, request, "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void updatePaymentStatusRejectsNonAdmin() {
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest();
        request.setPaymentStatus(PaymentStatus.PAID);
        User nonAdmin = new User();
        Role ownerRole = new Role();
        ownerRole.setRoleName("OWNER");
        nonAdmin.setRole(ownerRole);
        nonAdmin.setStatus("ACTIVE");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(nonAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.updatePaymentStatus(1, request, "owner@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(registrationRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void updatePaymentStatusRejectsInactiveAdmin() {
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest();
        request.setPaymentStatus(PaymentStatus.PAID);
        User inactiveAdmin = activeAdmin();
        inactiveAdmin.setStatus("INACTIVE");
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(inactiveAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.updatePaymentStatus(1, request, "admin@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(registrationRepository, never()).findByIdForUpdate(any());
    }

    private Registration pendingRegistration() {
        Registration registration = new Registration();
        registration.setRegistrationId(1);
        registration.setRegistrationNo("REG-001");
        registration.setTournamentId(10);
        registration.setHorseId(20);
        registration.setOwnerId(30);
        registration.setPaymentStatus(PaymentStatus.UNPAID);
        registration.setApprovalStatus(RegistrationStatus.PENDING);
        return registration;
    }

    private Tournament tournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(10);
        tournament.setTournamentName("Summer Championship");
        return tournament;
    }

    private User activeAdmin() {
        Role role = new Role();
        role.setRoleName("ADMIN");
        User admin = new User();
        admin.setUserID(99);
        admin.setRole(role);
        admin.setStatus("ACTIVE");
        admin.setFullName("Admin User");
        return admin;
    }

    private void stubResponseLookups(Registration registration) {
        when(tournamentRepository.findById(registration.getTournamentId()))
                .thenReturn(Optional.of(tournament()));
        when(horseRepository.findById(registration.getHorseId()))
                .thenReturn(Optional.empty());
        when(userRepository.findById(registration.getOwnerId()))
                .thenReturn(Optional.empty());
        if (registration.getReviewedBy() != null) {
            when(userRepository.findById(registration.getReviewedBy()))
                    .thenReturn(Optional.of(activeAdmin()));
        }
        when(raceEntryRepository.findByRegistrationIdAndStatus(
                registration.getRegistrationId(),
                RaceEntryStatus.ASSIGNED
        )).thenReturn(Optional.empty());
    }
}
