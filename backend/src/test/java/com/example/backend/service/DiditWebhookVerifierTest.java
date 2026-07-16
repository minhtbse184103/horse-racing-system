package com.example.backend.service;

import com.example.backend.config.DiditProperties;
import com.example.backend.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

class DiditWebhookVerifierTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final DiditProperties properties = new DiditProperties(
            "https://verification.didit.me", "key", "workflow", "secret",
            "http://localhost:5173", "", "ID_VERIFICATION,LIVENESS,FACE_MATCH");
    private final DiditWebhookVerifier verifier = new DiditWebhookVerifier(properties, mapper);

    @Test
    void v2CanonicalizationPreservesUnicodeSortsKeysAndShortensFloats() throws Exception {
        byte[] raw = "{\"z\":1.0,\"name\":\"Võ Trần\",\"nested\":{\"b\":2.5000,\"a\":1}}"
                .getBytes(StandardCharsets.UTF_8);
        JsonNode canonical = verifier.canonicalize(mapper.readTree(raw));

        assertEquals("{\"name\":\"Võ Trần\",\"nested\":{\"a\":1,\"b\":2.5},\"z\":1}", mapper.writeValueAsString(canonical));

        String signature = hmac(mapper.writeValueAsBytes(canonical));
        assertEquals("Võ Trần", verifier.verify(raw, String.valueOf(Instant.now().getEpochSecond()), signature, null, null).get("name").asText());
    }

    @Test
    void rejectsBadSignatureAndStaleTimestamp() {
        byte[] raw = "{\"event_id\":\"evt-1\"}".getBytes(StandardCharsets.UTF_8);
        assertThrows(ApiException.class, () -> verifier.verify(raw,
                String.valueOf(Instant.now().getEpochSecond()), "00", null, null));
        assertThrows(ApiException.class, () -> verifier.verify(raw,
                String.valueOf(Instant.now().minusSeconds(301).getEpochSecond()), hmacUnchecked(raw), null, null));
    }

    @Test
    void simpleSignatureUsesColonDelimitedCoreFields() throws Exception {
        long timestamp = Instant.now().getEpochSecond();
        byte[] raw = ("{\"timestamp\":" + timestamp + ",\"session_id\":\"session-1\","
                + "\"status\":\"Approved\",\"webhook_type\":\"status.updated\"}")
                .getBytes(StandardCharsets.UTF_8);
        String simple = hmac((timestamp + ":session-1:Approved:status.updated").getBytes(StandardCharsets.UTF_8));

        assertEquals("session-1", verifier.verify(raw, String.valueOf(timestamp), null, null, simple)
                .get("session_id").asText());
    }

    private String hmac(byte[] bytes) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(bytes));
    }

    private String hmacUnchecked(byte[] bytes) {
        try { return hmac(bytes); } catch (Exception exception) { throw new RuntimeException(exception); }
    }
}
