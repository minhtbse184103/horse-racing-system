package com.example.backend.service;

import com.example.backend.client.DiditClient;
import com.example.backend.config.DiditProperties;
import com.example.backend.entity.*;
import com.example.backend.enums.KycStatus;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class KycServiceImplTest {
    private final UserRepository users = mock(UserRepository.class);
    private final UserVerificationRepository verifications = mock(UserVerificationRepository.class);
    private final DiditWebhookEventRepository events = mock(DiditWebhookEventRepository.class);
    private final WalletRepository wallets = mock(WalletRepository.class);
    private final DiditClient client = mock(DiditClient.class);
    private final DiditWebhookVerifier verifier = mock(DiditWebhookVerifier.class);
    private final DiditProperties properties = new DiditProperties(
            "https://verification.didit.me", "key", "workflow", "secret",
            "http://localhost:5173", "sandbox", "ID_VERIFICATION,LIVENESS,FACE_MATCH");
    private KycServiceImpl service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new KycServiceImpl(users, verifications, events, wallets, client, properties, verifier);
        Role role = new Role();
        role.setRoleName("SPECTATOR");
        user = new User();
        user.setUserID(7);
        user.setEmail("spectator@test.local");
        user.setStatus("ACTIVE");
        user.setRole(role);
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(users.findByIdForUpdate(7)).thenReturn(Optional.of(user));
    }

    @Test
    void reusesActiveSessionWithoutCallingDidit() {
        UserVerification existing = UserVerification.builder().verificationId(11).userId(7)
                .provider("DIDIT").providerSessionId("session-1").workflowId("workflow")
                .vendorData("user-7").verificationUrl("https://verify.example/session-1")
                .status(KycStatus.IN_PROGRESS).attemptNumber(1).build();
        when(verifications.findActiveByUserId(eq(7), anyCollection())).thenReturn(List.of(existing));

        var response = service.createSession(user.getEmail());

        assertTrue(response.isReused());
        assertEquals("session-1", existing.getProviderSessionId());
        verifyNoInteractions(client);
    }

    @Test
    void safeResponseDoesNotExposeProviderSessionOrFullDocument() throws Exception {
        UserVerification existing = UserVerification.builder().verificationId(11).userId(7)
                .provider("DIDIT").providerSessionId("secret-session").workflowId("workflow")
                .vendorData("user-7").status(KycStatus.VERIFIED).attemptNumber(1)
                .documentLastFour("1234").build();
        when(verifications.findFirstByUserIdOrderByAttemptNumberDesc(7)).thenReturn(Optional.of(existing));
        when(wallets.findByUserId(7)).thenReturn(Optional.empty());

        String json = new ObjectMapper().writeValueAsString(service.getMine(user.getEmail()));

        assertFalse(json.contains("secret-session"));
        assertFalse(json.contains("providerSessionId"));
        assertFalse(json.contains("identityNumber"));
        assertTrue(json.contains("1234"));
    }

    @Test
    void createsSessionWithBackendOwnedVendorData() throws Exception {
        when(verifications.findActiveByUserId(eq(7), anyCollection())).thenReturn(List.of());
        when(verifications.findFirstByUserIdAndStatusOrderByAttemptNumberDesc(7, KycStatus.VERIFIED))
                .thenReturn(Optional.empty());
        when(verifications.findMaxAttemptNumber(7)).thenReturn(2);
        when(client.createSession("user-7")).thenReturn(new ObjectMapper().readTree("""
                {"session_id":"session-3","session_number":3,"verification_url":"https://verify.example/session-3"}
                """));
        when(verifications.save(any())).thenAnswer(invocation -> {
            UserVerification saved = invocation.getArgument(0);
            saved.setVerificationId(15);
            return saved;
        });

        var response = service.createSession(user.getEmail());

        assertFalse(response.isReused());
        assertEquals("https://verify.example/session-3", response.getVerificationUrl());
        verify(client).createSession("user-7");
        verify(verifications).save(argThat(value -> value.getAttemptNumber() == 3
                && "user-7".equals(value.getVendorData())));
    }

    @Test
    void duplicateWebhookDoesNotRetrieveDecisionTwice() throws Exception {
        byte[] body = "{}".getBytes();
        when(verifier.verify(any(), any(), any(), any(), any())).thenReturn(new ObjectMapper().readTree("""
                {"event_id":"evt-1","session_id":"session-1","status":"Approved","webhook_type":"status.updated"}
                """));
        when(events.insertIfAbsent(any(), any(), any(), any())).thenReturn(0);

        service.processWebhook(body, "timestamp", "signature", null, null, false);

        verifyNoInteractions(client);
    }

    @Test
    void approvedDecisionRequiresMatchingVendorWorkflowAndFeatures() throws Exception {
        byte[] body = "{}".getBytes();
        DiditWebhookEvent event = DiditWebhookEvent.builder().eventId("evt-2").providerSessionId("session-2").build();
        UserVerification verification = UserVerification.builder().verificationId(12).userId(7)
                .provider("DIDIT").providerSessionId("session-2").workflowId("workflow")
                .vendorData("user-7").status(KycStatus.IN_REVIEW).attemptNumber(1).build();
        when(verifier.verify(any(), any(), any(), any(), any())).thenReturn(new ObjectMapper().readTree("""
                {"event_id":"evt-2","session_id":"session-2","status":"Approved","webhook_type":"status.updated"}
                """));
        when(events.insertIfAbsent(any(), any(), any(), any())).thenReturn(1);
        when(events.findByEventId("evt-2")).thenReturn(Optional.of(event));
        when(verifications.findByProviderSessionIdForUpdate("session-2")).thenReturn(Optional.of(verification));
        when(client.retrieveDecision("session-2")).thenReturn(new ObjectMapper().readTree("""
                {
                  "session_id":"session-2","vendor_data":"user-7","workflow_id":"workflow",
                  "session_kind":"KYC","environment":"sandbox","status":"Approved",
                  "id_verifications":[{"status":"Approved","full_name":"Test User","date_of_birth":"1990-01-01","document_number":"12345678","document_type":"ID_CARD"}],
                  "liveness_checks":[{"status":"Approved"}],
                  "face_matches":[{"status":"Approved","score":0.98}]
                }
                """));
        when(wallets.findByUserIdForUpdate(7)).thenReturn(Optional.empty());

        service.processWebhook(body, "timestamp", "signature", null, null, false);

        assertEquals(KycStatus.VERIFIED, verification.getStatus());
        assertEquals("5678", verification.getDocumentLastFour());
        verify(wallets).save(argThat(wallet -> wallet.getUserId() == 7));
    }

    @Test
    void approvedDecisionWithVendorMismatchNeverOpensWallet() throws Exception {
        byte[] body = "{}".getBytes();
        DiditWebhookEvent event = DiditWebhookEvent.builder().eventId("evt-3").providerSessionId("session-3").build();
        UserVerification verification = UserVerification.builder().verificationId(13).userId(7)
                .provider("DIDIT").providerSessionId("session-3").workflowId("workflow")
                .vendorData("user-7").status(KycStatus.IN_REVIEW).attemptNumber(1).build();
        when(verifier.verify(any(), any(), any(), any(), any())).thenReturn(new ObjectMapper().readTree("""
                {"event_id":"evt-3","session_id":"session-3","status":"Approved"}
                """));
        when(events.insertIfAbsent(any(), any(), any(), any())).thenReturn(1);
        when(events.findByEventId("evt-3")).thenReturn(Optional.of(event));
        when(verifications.findByProviderSessionIdForUpdate("session-3")).thenReturn(Optional.of(verification));
        when(client.retrieveDecision("session-3")).thenReturn(new ObjectMapper().readTree("""
                {"session_id":"session-3","vendor_data":"user-999","workflow_id":"workflow","status":"Approved"}
                """));

        assertThrows(ApiException.class, () -> service.processWebhook(body, "timestamp", "signature", null, null, false));
        verify(wallets, never()).save(any());
        assertNotEquals(KycStatus.VERIFIED, verification.getStatus());
    }

    @Test
    void signedDiditTestWebhookIsAcknowledgedWithoutChangingState() throws Exception {
        byte[] body = "{}".getBytes();
        when(verifier.verify(any(), any(), any(), any(), any())).thenReturn(new ObjectMapper().readTree("""
                {"session_id":"test-session","status":"Approved","vendor_data":"test-vendor-data-123"}
                """));

        service.processWebhook(body, "timestamp", "signature", null, null, true);

        verify(verifier).verify(body, "timestamp", "signature", null, null);
        verifyNoInteractions(events, client);
        verify(wallets, never()).save(any());
    }

    @Test
    void missingDiditConfigurationFailsClosed() {
        DiditProperties missing = new DiditProperties("", "", "", "", "", "", "");
        assertThrows(IllegalStateException.class, missing::requireSessionConfiguration);
        assertThrows(IllegalStateException.class, missing::requireWebhookConfiguration);
    }
}
