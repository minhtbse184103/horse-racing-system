package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.PaymentPurpose;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.PrizeDistributionStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.OwnerTournamentRegistrationRequest;
import com.example.backend.dto.response.OwnerEntryFeeTransactionResponse;
import com.example.backend.dto.response.OwnerRegistrationPaymentResponse;
import com.example.backend.dto.response.PaymentTransactionResponse;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.entity.PrizeDistribution;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentCondition;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.OwnerApplicationRepository;
import com.example.backend.repository.PaymentTransactionRepository;
import com.example.backend.repository.PrizeDistributionRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.UserVerificationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerTournamentRegistrationServiceTest {

    @Mock private RegistrationRepository registrationRepository;
    @Mock private TournamentRepository tournamentRepository;
    @Mock private TournamentConditionRepository tournamentConditionRepository;
    @Mock private HorseRepository horseRepository;
    @Mock private UserRepository userRepository;
    @Mock private JockeyProfileRepository jockeyProfileRepository;
    @Mock private OwnerApplicationRepository ownerApplicationRepository;
    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private JockeyInvitationRepository jockeyInvitationRepository;
    @Mock private PrizeDistributionRepository prizeDistributionRepository;
    @Mock private RaceEntryRepository raceEntryRepository;
    @Mock private RaceResultRepository raceResultRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private UserVerificationRepository userVerificationRepository;
    @Mock private VnpayPaymentService vnpayPaymentService;
    @Mock private RegistrationEligibilityService eligibilityService;

    private OwnerTournamentRegistrationService service;

    @BeforeEach
    void setUp() {
        service = new OwnerTournamentRegistrationService(
                registrationRepository,
                tournamentRepository,
                tournamentConditionRepository,
                horseRepository,
                userRepository,
                jockeyProfileRepository,
                ownerApplicationRepository,
                paymentTransactionRepository,
                jockeyInvitationRepository,
                prizeDistributionRepository,
                raceEntryRepository,
                raceResultRepository,
                raceRepository,
                userVerificationRepository,
                vnpayPaymentService,
                eligibilityService
        );

        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(
                        "owner@example.com",
                        null
                ));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void startPaymentUsesRegistrationCreatedByAcceptedInvitation() {
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        Registration registration = pendingRegistration();
        JockeyInvitation invitation = JockeyInvitation.builder()
                .invitationId(9)
                .registrationId(77)
                .ownerId(30)
                .jockeyId(40)
                .horseId(20)
                .tournamentId(10)
                .status("ACCEPTED")
                .build();

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(registrationRepository.findByIdForUpdate(77)).thenReturn(Optional.of(registration));
        when(jockeyInvitationRepository.findByRegistrationIdAndOwnerIdAndStatus(77, 30, "ACCEPTED"))
                .thenReturn(Optional.of(invitation));
        when(tournamentRepository.findById(10)).thenReturn(Optional.of(tournament));
        when(horseRepository.findById(20)).thenReturn(Optional.of(horse));
        when(userRepository.findById(30)).thenReturn(Optional.of(owner));
        when(userRepository.findById(40)).thenReturn(Optional.of(jockey));
        stubJockeyProfile();
        when(raceEntryRepository.findByRegistrationIdAndStatus(77, RaceEntryStatus.ASSIGNED))
                .thenReturn(Optional.empty());

        PaymentTransaction paymentTransaction = paymentTransaction();
        when(vnpayPaymentService.createRegistrationFeePayment(registration, tournament, "127.0.0.1"))
                .thenReturn(paymentTransaction);
        when(vnpayPaymentService.toResponse(paymentTransaction)).thenReturn(
                PaymentTransactionResponse.builder().registrationId(77).status("PENDING").build()
        );

        OwnerRegistrationPaymentResponse response =
                service.startRegistrationPayment(77, "127.0.0.1");

        assertEquals("https://sandbox.test/pay", response.getPaymentUrl());
        verify(eligibilityService).validateSubmissionWindow(tournament);
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void startPaymentRejectsRegistrationWithoutLinkedAcceptedInvitation() {
        User owner = user(30, "owner@example.com", "OWNER");
        Registration registration = pendingRegistration();
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(registrationRepository.findByIdForUpdate(77)).thenReturn(Optional.of(registration));
        when(jockeyInvitationRepository.findByRegistrationIdAndOwnerIdAndStatus(77, 30, "ACCEPTED"))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.startRegistrationPayment(77, "127.0.0.1")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(vnpayPaymentService, never()).createRegistrationFeePayment(any(), any(), any());
    }

    @Test
    void startPaymentRejectsRegistrationOwnedByAnotherOwner() {
        User owner = user(30, "owner@example.com", "OWNER");
        Registration registration = pendingRegistration();
        registration.setOwnerId(999);
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(registrationRepository.findByIdForUpdate(77)).thenReturn(Optional.of(registration));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.startRegistrationPayment(77, "127.0.0.1")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(jockeyInvitationRepository, never())
                .findByRegistrationIdAndOwnerIdAndStatus(any(), any(), any());
    }

    @Test
    @Disabled("Obsolete submitRegistration contract; registration creation now belongs to acceptInvitation")
    void submitSuccessCreatesPendingUnpaidRegistration() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(true);
        stubNoRegistrationConflicts(tournament, horse, owner, jockey);
        when(registrationRepository.save(any(Registration.class)))
                .thenAnswer(invocation -> {
                    Registration registration = invocation.getArgument(0);
                    registration.setRegistrationId(77);
                    return registration;
                });
        when(tournamentRepository.findById(10)).thenReturn(Optional.of(tournament));
        when(horseRepository.findById(20)).thenReturn(Optional.of(horse));
        when(userRepository.findById(30)).thenReturn(Optional.of(owner));
        when(userRepository.findById(40)).thenReturn(Optional.of(jockey));
        stubJockeyProfile();
        when(raceEntryRepository.findByRegistrationIdAndStatus(
                77, RaceEntryStatus.ASSIGNED
        )).thenReturn(Optional.empty());

        PaymentTransaction paymentTransaction = paymentTransaction();
        when(vnpayPaymentService.createRegistrationFeePayment(
                any(Registration.class),
                eq(tournament),
                eq("127.0.0.1")
        )).thenReturn(paymentTransaction);
        when(vnpayPaymentService.toResponse(paymentTransaction))
                .thenReturn(PaymentTransactionResponse.builder()
                        .paymentTransactionId(501)
                        .registrationId(77)
                        .status("PENDING")
                        .txnRef("REG-77-TEST")
                        .build());

        OwnerRegistrationPaymentResponse response =
                service.startRegistrationPayment(77, "127.0.0.1");
        RegistrationResponse registrationResponse = response.getRegistration();

        ArgumentCaptor<Registration> captor =
                ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());
        Registration saved = captor.getValue();

        assertEquals(10, saved.getTournamentId());
        assertEquals(20, saved.getHorseId());
        assertEquals(30, saved.getOwnerId());
        assertEquals(40, saved.getJockeyId());
        assertEquals(PaymentStatus.UNPAID, saved.getPaymentStatus());
        assertEquals(RegistrationStatus.PENDING, saved.getApprovalStatus());
        assertNotNull(saved.getSubmittedAt());
        assertTrue(saved.getRegistrationNo().startsWith("REG-T10-"));
        assertEquals(RegistrationStatus.PENDING, registrationResponse.getApprovalStatus());
        assertEquals(PaymentStatus.UNPAID, registrationResponse.getPaymentStatus());
        assertEquals("https://sandbox.test/pay", response.getPaymentUrl());
        verify(eligibilityService).validateSubmissionWindow(tournament);
        verify(eligibilityService).validateLoadedParticipants(
                tournament,
                horse,
                owner,
                jockey
        );
        verify(eligibilityService).validateNewSubmissionCapacity(tournament);
    }

    @Test
    @Disabled("Obsolete submitRegistration contract; payment now starts by registrationId")
    void submitExistingUnpaidRegistrationRevalidatesCandidateWithoutSelfDuplicateCheck() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        Registration existing = new Registration();
        existing.setRegistrationId(77);
        existing.setTournamentId(10);
        existing.setHorseId(20);
        existing.setOwnerId(30);
        existing.setJockeyId(40);
        existing.setRegistrationNo("REG-T10-EXISTING");
        existing.setPaymentStatus(PaymentStatus.UNPAID);
        existing.setApprovalStatus(RegistrationStatus.PENDING);

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(true);
        when(registrationRepository.findActiveByTournamentHorseOwnerAndJockey(
                eq(10), eq(20), eq(30), eq(40), any(Collection.class)
        )).thenReturn(List.of(existing));
        when(tournamentRepository.findById(10)).thenReturn(Optional.of(tournament));
        when(horseRepository.findById(20)).thenReturn(Optional.of(horse));
        when(userRepository.findById(30)).thenReturn(Optional.of(owner));
        when(userRepository.findById(40)).thenReturn(Optional.of(jockey));
        stubJockeyProfile();
        when(raceEntryRepository.findByRegistrationIdAndStatus(
                77, RaceEntryStatus.ASSIGNED
        )).thenReturn(Optional.empty());

        PaymentTransaction paymentTransaction = paymentTransaction();
        when(vnpayPaymentService.createRegistrationFeePayment(
                existing,
                tournament,
                "127.0.0.1"
        )).thenReturn(paymentTransaction);
        when(vnpayPaymentService.toResponse(paymentTransaction))
                .thenReturn(PaymentTransactionResponse.builder()
                        .paymentTransactionId(501)
                        .registrationId(77)
                        .status("PENDING")
                        .txnRef("REG-77-TEST")
                        .build());

        OwnerRegistrationPaymentResponse response =
                service.startRegistrationPayment(77, "127.0.0.1");

        assertEquals("https://sandbox.test/pay", response.getPaymentUrl());
        verify(eligibilityService).validateSubmissionWindow(tournament);
        verify(eligibilityService).validateLoadedParticipants(
                tournament,
                horse,
                owner,
                jockey
        );
        verify(eligibilityService, never()).validateNewSubmissionCapacity(any());
        verify(registrationRepository, never())
                .countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                        any(), any(), any(), any()
                );
        verify(registrationRepository, never()).save(any());
    }

    @Test
    @Disabled("Obsolete submitRegistration contract; covered by startPayment linked-invitation tests")
    void submitFailsWithoutAcceptedInvitation() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.startRegistrationPayment(77, "127.0.0.1")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "An ACCEPTED jockey invitation is required before registration.",
                exception.getMessage()
        );
        verify(registrationRepository, never()).save(any());
    }

    @Test
    @Disabled("Obsolete submitRegistration contract; availability is enforced during acceptInvitation")
    void submitRejectsDuplicateTournamentHorseRegistration() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(true);
        when(registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                eq(10),
                eq(20),
                any(Collection.class),
                eq(null)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.startRegistrationPayment(77, "127.0.0.1")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Horse already has an active registration in this tournament.",
                exception.getMessage()
        );
        verify(registrationRepository, never()).save(any());
    }

    @Test
    @Disabled("Obsolete submitRegistration contract; availability is enforced during acceptInvitation")
    void submitRejectsHorseRegistrationInOverlappingTournament() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(true);
        when(registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                eq(10),
                eq(20),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                eq(10),
                eq(30),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByOverlappingTournamentAndHorseIdAndStatusInExcludingRegistration(
                eq(20),
                eq(tournament.getStartDate()),
                eq(tournament.getEndDate()),
                any(Collection.class),
                eq(null)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.startRegistrationPayment(77, "127.0.0.1")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Horse already has an active registration in an overlapping tournament.",
                exception.getMessage()
        );
        verify(registrationRepository, never()).save(any());
    }

    @Test
    @Disabled("Obsolete submitRegistration contract; payment-window behavior has a dedicated startPayment test")
    void submitRejectsTournamentNotOpen() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        Tournament tournament = openTournament();
        tournament.setStatus(EventStatus.REGISTRATION_CLOSED);

        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(tournamentRepository.findById(10))
                .thenReturn(Optional.of(tournament));
        doThrow(new ApiException(
                HttpStatus.CONFLICT,
                "Tournament is not open for registration."
        )).when(eligibilityService).validateSubmissionWindow(tournament);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.startRegistrationPayment(77, "127.0.0.1")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Tournament is not open for registration.",
                exception.getMessage()
        );
        verify(horseRepository, never()).findByHorseIdAndOwnerId(any(), any());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    @Disabled("Obsolete submitRegistration contract; owner uniqueness is enforced during invitation acceptance")
    void submitRejectsOwnerWithAnotherActiveRegistrationInSameTournament() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(true);
        when(registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                eq(10),
                eq(30),
                any(Collection.class),
                eq(null)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.startRegistrationPayment(77, "127.0.0.1")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Owner already has an active registration in this tournament.",
                exception.getMessage()
        );
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void getOpenTournamentsReturnsOwnerFriendlyTournamentSummaries() {
        User owner = user(30, "owner@example.com", "OWNER");
        Tournament tournament = openTournament();
        tournament.setCreatedBy(99);
        tournament.setVenue("Bangkok Equestrian Park");
        tournament.setEntryFee(BigDecimal.valueOf(1_000_000));

        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(tournamentRepository.findOpenForRegistration(
                eq(EventStatus.OPEN_FOR_REGISTRATION),
                any(LocalDateTime.class)
        )).thenReturn(List.of(tournament));
        TournamentCondition condition = new TournamentCondition();
        condition.setConditionId(7);
        condition.setTournamentId(10);
        condition.setConditionType("GENDER");
        condition.setOperator("EQ");
        condition.setValue("ANY");
        when(tournamentConditionRepository.findByTournamentIds(List.of(10)))
                .thenReturn(List.of(condition));
        when(raceRepository.countByTournamentId(10)).thenReturn(3L);
        when(registrationRepository.countByTournamentId(10)).thenReturn(5L);
        when(registrationRepository.countByTournamentIdAndApprovalStatusIn(
                eq(10),
                any(Collection.class)
        )).thenReturn(2L);

        var result = service.getOpenTournaments();

        assertEquals(1, result.size());
        assertEquals(10, result.getFirst().getTournamentId());
        assertEquals("Summer Cup", result.getFirst().getTournamentName());
        assertEquals("Bangkok Equestrian Park", result.getFirst().getVenue());
        assertEquals(EventStatus.OPEN_FOR_REGISTRATION, result.getFirst().getStatus());
        assertEquals(3L, result.getFirst().getRaceCount());
        assertEquals(5L, result.getFirst().getRegistrationCount());
        assertEquals(2L, result.getFirst().getApprovedRegistrationCount());
        assertEquals(1, result.getFirst().getConditions().size());
        assertEquals("ANY", result.getFirst().getConditions().getFirst().getValue());
    }

    @Test
    void getOpenTournamentsQueriesOnlyCurrentlyOpenRegistrationWindow() {
        User owner = user(30, "owner@example.com", "OWNER");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(tournamentRepository.findOpenForRegistration(
                eq(EventStatus.OPEN_FOR_REGISTRATION),
                any(LocalDateTime.class)
        )).thenReturn(List.of());

        var result = service.getOpenTournaments();

        assertTrue(result.isEmpty());
        verify(tournamentRepository).findOpenForRegistration(
                eq(EventStatus.OPEN_FOR_REGISTRATION),
                any(LocalDateTime.class)
        );
    }

    @Test
    void getEntryFeeTransactionsReturnsOnlyCurrentOwnerRegistrationFeePayments() {
        User owner = user(30, "owner@example.com", "OWNER");
        Registration registration = paidRegistration();
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        JockeyProfile jockeyProfile = JockeyProfile.builder()
                .jockeyId(40)
                .fullName("Jockey Full Name")
                .weight(BigDecimal.valueOf(55))
                .build();
        PaymentTransaction paymentTransaction = paymentTransaction();
        paymentTransaction.setUserId(30);
        paymentTransaction.setPurpose(PaymentPurpose.REGISTRATION_FEE);
        paymentTransaction.setProvider("VNPAY");
        paymentTransaction.setAmount(BigDecimal.valueOf(1_000_000));
        paymentTransaction.setCurrency("VND");
        paymentTransaction.setProviderTransactionNo("VNP-123");
        paymentTransaction.setResponseCode("00");
        paymentTransaction.setCreatedAt(LocalDateTime.now().minusMinutes(10));
        paymentTransaction.setPaidAt(LocalDateTime.now().minusMinutes(5));

        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(paymentTransactionRepository.findByUserIdAndPurposeOrderByCreatedAtDesc(
                30,
                PaymentPurpose.REGISTRATION_FEE
        )).thenReturn(List.of(paymentTransaction));
        when(registrationRepository.findById(77)).thenReturn(Optional.of(registration));
        when(tournamentRepository.findById(10)).thenReturn(Optional.of(tournament));
        when(horseRepository.findById(20)).thenReturn(Optional.of(horse));
        when(jockeyProfileRepository.findById(40)).thenReturn(Optional.of(jockeyProfile));

        List<OwnerEntryFeeTransactionResponse> result =
                service.getEntryFeeTransactions();

        assertEquals(1, result.size());
        OwnerEntryFeeTransactionResponse transaction = result.getFirst();
        assertEquals(501, transaction.getPaymentTransactionId());
        assertEquals(77, transaction.getRegistrationId());
        assertEquals("REG-T10-PAID", transaction.getRegistrationNo());
        assertEquals(10, transaction.getTournamentId());
        assertEquals("Summer Cup", transaction.getTournamentName());
        assertEquals(20, transaction.getHorseId());
        assertEquals("Lightning", transaction.getHorseName());
        assertEquals(40, transaction.getJockeyId());
        assertEquals("Jockey Full Name", transaction.getJockeyName());
        assertEquals(BigDecimal.valueOf(1_000_000), transaction.getAmount());
        assertEquals("VNPAY", transaction.getProvider());
        assertEquals("REG-77-TEST", transaction.getTxnRef());
        assertEquals("VNP-123", transaction.getProviderTransactionNo());
        assertEquals("00", transaction.getResponseCode());
        assertEquals(PaymentStatus.PAID, transaction.getRegistrationPaymentStatus());
        assertEquals(RegistrationStatus.APPROVED, transaction.getRegistrationApprovalStatus());
    }

    @Test
    void getEntryFeeTransactionsReturnsEmptyListWhenOwnerHasNoPayments() {
        User owner = user(30, "owner@example.com", "OWNER");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(paymentTransactionRepository.findByUserIdAndPurposeOrderByCreatedAtDesc(
                30,
                PaymentPurpose.REGISTRATION_FEE
        )).thenReturn(List.of());

        List<OwnerEntryFeeTransactionResponse> result =
                service.getEntryFeeTransactions();

        assertTrue(result.isEmpty());
        verify(paymentTransactionRepository)
                .findByUserIdAndPurposeOrderByCreatedAtDesc(
                        30,
                        PaymentPurpose.REGISTRATION_FEE
                );
    }

    @Test
    void markOwnerPrizeDistributionPaidUpdatesOnlyOwnedPendingRow() {
        User owner = user(30, "owner@example.com", "OWNER");
        PrizeDistribution distribution = prizeDistribution(301, 30, PrizeDistributionStatus.PENDING);
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(prizeDistributionRepository.findByIdForUpdate(301))
                .thenReturn(Optional.of(distribution));

        service.markOwnerPrizeDistributionPaid(301);

        assertEquals(PrizeDistributionStatus.PAID, distribution.getStatus());
        assertNotNull(distribution.getDistributedAt());
    }

    @Test
    void markOwnerPrizeDistributionPaidRejectsOtherOwnerRow() {
        User owner = user(30, "owner@example.com", "OWNER");
        PrizeDistribution distribution = prizeDistribution(301, 99, PrizeDistributionStatus.PENDING);
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(prizeDistributionRepository.findByIdForUpdate(301))
                .thenReturn(Optional.of(distribution));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.markOwnerPrizeDistributionPaid(301)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals(PrizeDistributionStatus.PENDING, distribution.getStatus());
    }

    @Test
    void markOwnerPrizeDistributionPaidRejectsNonPendingRow() {
        User owner = user(30, "owner@example.com", "OWNER");
        PrizeDistribution distribution = prizeDistribution(301, 30, PrizeDistributionStatus.PAID);
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(prizeDistributionRepository.findByIdForUpdate(301))
                .thenReturn(Optional.of(distribution));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.markOwnerPrizeDistributionPaid(301)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(PrizeDistributionStatus.PAID, distribution.getStatus());
    }

    private OwnerTournamentRegistrationRequest request() {
        OwnerTournamentRegistrationRequest request =
                new OwnerTournamentRegistrationRequest();
        request.setTournamentId(10);
        request.setHorseId(20);
        request.setJockeyId(40);
        return request;
    }

    private PaymentTransaction paymentTransaction() {
        PaymentTransaction paymentTransaction = new PaymentTransaction();
        paymentTransaction.setPaymentTransactionId(501);
        paymentTransaction.setRegistrationId(77);
        paymentTransaction.setTxnRef("REG-77-TEST");
        paymentTransaction.setStatus("PENDING");
        paymentTransaction.setPayUrl("https://sandbox.test/pay");
        return paymentTransaction;
    }

    private Registration pendingRegistration() {
        Registration registration = new Registration();
        registration.setRegistrationId(77);
        registration.setRegistrationNo("REG-T10-PENDING");
        registration.setTournamentId(10);
        registration.setHorseId(20);
        registration.setOwnerId(30);
        registration.setJockeyId(40);
        registration.setPaymentStatus(PaymentStatus.UNPAID);
        registration.setApprovalStatus(RegistrationStatus.PENDING);
        registration.setSubmittedAt(LocalDateTime.now());
        return registration;
    }

    private Registration paidRegistration() {
        Registration registration = new Registration();
        registration.setRegistrationId(77);
        registration.setRegistrationNo("REG-T10-PAID");
        registration.setTournamentId(10);
        registration.setHorseId(20);
        registration.setOwnerId(30);
        registration.setJockeyId(40);
        registration.setPaymentStatus(PaymentStatus.PAID);
        registration.setApprovalStatus(RegistrationStatus.APPROVED);
        return registration;
    }

    private PrizeDistribution prizeDistribution(
            Integer prizeDistributionId,
            Integer ownerId,
            String status
    ) {
        PrizeDistribution distribution = new PrizeDistribution();
        distribution.setPrizeDistributionId(prizeDistributionId);
        distribution.setRaceId(10);
        distribution.setRaceEntryId(20);
        distribution.setRacePrizeId(30);
        distribution.setOwnerId(ownerId);
        distribution.setJockeyId(40);
        distribution.setTotalPrize(BigDecimal.valueOf(1_000_000));
        distribution.setOwnerAmount(BigDecimal.valueOf(800_000));
        distribution.setJockeyAmount(BigDecimal.valueOf(200_000));
        distribution.setStatus(status);
        return distribution;
    }

    private void stubBaseLookups(
            User owner,
            User jockey,
            Tournament tournament,
            Horse horse
    ) {
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(tournamentRepository.findById(10))
                .thenReturn(Optional.of(tournament));
        when(horseRepository.findByHorseIdAndOwnerId(20, 30))
                .thenReturn(Optional.of(horse));
        when(userRepository.findById(40))
                .thenReturn(Optional.of(jockey));
    }

    private void stubJockeyProfile() {
        when(jockeyProfileRepository.findById(40))
                .thenReturn(Optional.of(JockeyProfile.builder()
                        .jockeyId(40)
                        .fullName("Jockey Full Name")
                        .weight(BigDecimal.valueOf(55))
                        .build()));
    }

    private void stubNoRegistrationConflicts(
            Tournament tournament,
            Horse horse,
            User owner,
            User jockey
    ) {
        when(registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                eq(tournament.getTournamentId()),
                eq(horse.getHorseId()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                eq(tournament.getTournamentId()),
                eq(owner.getUserID()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                eq(tournament.getTournamentId()),
                eq(jockey.getUserID()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
                eq(jockey.getUserID()),
                eq(tournament.getStartDate()),
                eq(tournament.getEndDate()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByOverlappingTournamentAndHorseIdAndStatusInExcludingRegistration(
                eq(horse.getHorseId()),
                eq(tournament.getStartDate()),
                eq(tournament.getEndDate()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
    }

    private Tournament openTournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(10);
        tournament.setTournamentName("Summer Cup");
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        tournament.setRegistrationOpenAt(LocalDateTime.now().minusDays(1));
        tournament.setRegistrationCloseAt(LocalDateTime.now().plusDays(1));
        tournament.setStartDate(LocalDate.now().plusDays(3));
        tournament.setEndDate(LocalDate.now().plusDays(5));
        tournament.setMaxRegistrations(20);
        return tournament;
    }

    private Horse activeHorse() {
        return Horse.builder()
                .horseId(20)
                .ownerId(30)
                .horseName("Lightning")
                .age(4)
                .dayOfBirth(LocalDate.now().minusYears(4))
                .breeding("Thoroughbred")
                .sex("MALE")
                .weight(BigDecimal.valueOf(480))
                .healthCertExpiry(LocalDate.now().plusMonths(6))
                .status("ACTIVE")
                .build();
    }

    private User user(Integer id, String email, String roleName) {
        Role role = new Role();
        role.setRoleName(roleName);

        User user = new User();
        user.setUserID(id);
        user.setEmail(email);
        user.setUsername(roleName + " User");
        user.setStatus("ACTIVE");
        user.setRole(role);
        return user;
    }
}
