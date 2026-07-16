package com.example.backend.service;

import com.example.backend.config.DiditProperties;
import com.example.backend.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DiditWebhookVerifier {
    private static final long MAX_TIMESTAMP_SKEW_SECONDS = 300;
    private final DiditProperties properties;
    private final ObjectMapper objectMapper;

    public JsonNode verify(byte[] rawBody, String timestampHeader, String signatureV2,
                           String rawSignature, String simpleSignature) {
        try {
            properties.requireWebhookConfiguration();
            JsonNode body = objectMapper.readTree(rawBody);
            verifyTimestamp(timestampHeader);

            boolean valid = false;
            if (hasText(signatureV2)) {
                byte[] canonical = objectMapper.writeValueAsBytes(canonicalize(body));
                valid = matches(signatureV2, hmac(canonical));
            }
            if (!valid && hasText(rawSignature)) {
                valid = matches(rawSignature, hmac(rawBody));
            }
            if (!valid && hasText(simpleSignature)) {
                String core = String.join(":", text(body, "timestamp"), text(body, "session_id"),
                        text(body, "status"), text(body, "webhook_type"));
                valid = matches(simpleSignature, hmac(core.getBytes(StandardCharsets.UTF_8)));
            }
            if (!valid) throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Didit webhook signature.");
            return body;
        } catch (ApiException exception) {
            throw exception;
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid Didit webhook payload.");
        }
    }

    JsonNode canonicalize(JsonNode node) {
        if (node.isObject()) {
            ObjectNode result = objectMapper.createObjectNode();
            List<String> names = new ArrayList<>();
            node.fieldNames().forEachRemaining(names::add);
            Collections.sort(names);
            names.forEach(name -> result.set(name, canonicalize(node.get(name))));
            return result;
        }
        if (node.isArray()) {
            ArrayNode result = objectMapper.createArrayNode();
            node.forEach(item -> result.add(canonicalize(item)));
            return result;
        }
        if (node.isFloatingPointNumber()) {
            BigDecimal shortened = node.decimalValue().stripTrailingZeros();
            return shortened.scale() <= 0
                    ? new BigIntegerNode(shortened.toBigIntegerExact())
                    : DecimalNode.valueOf(shortened);
        }
        return node.deepCopy();
    }

    private void verifyTimestamp(String timestampHeader) {
        if (!hasText(timestampHeader)) throw new ApiException(HttpStatus.UNAUTHORIZED, "Missing Didit timestamp.");
        try {
            long value = Long.parseLong(timestampHeader.trim());
            if (value > 10_000_000_000L) value /= 1000;
            if (Math.abs(Instant.now().getEpochSecond() - value) > MAX_TIMESTAMP_SKEW_SECONDS) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Expired Didit webhook timestamp.");
            }
        } catch (NumberFormatException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Didit timestamp.");
        }
    }

    private byte[] hmac(byte[] content) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(properties.getWebhookSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return mac.doFinal(content);
    }

    private boolean matches(String supplied, byte[] expected) {
        String normalized = supplied.trim().replaceFirst("^sha256=", "");
        byte[] suppliedBytes;
        try {
            suppliedBytes = HexFormat.of().parseHex(normalized);
        } catch (IllegalArgumentException exception) {
            return false;
        }
        return MessageDigest.isEqual(expected, suppliedBytes);
    }

    private static boolean hasText(String value) { return value != null && !value.isBlank(); }
    private static String text(JsonNode node, String field) { return node.path(field).asText(""); }
}
