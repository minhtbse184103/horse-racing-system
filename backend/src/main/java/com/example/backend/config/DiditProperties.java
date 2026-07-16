package com.example.backend.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Getter
public class DiditProperties {
    private final String baseUrl;
    private final String apiKey;
    private final String workflowId;
    private final String webhookSecret;
    private final String frontendUrl;
    private final String expectedEnvironment;
    private final Set<String> requiredFeatures;

    public DiditProperties(
            @Value("${didit.base-url:}") String baseUrl,
            @Value("${didit.api-key:}") String apiKey,
            @Value("${didit.workflow-id:}") String workflowId,
            @Value("${didit.webhook-secret:}") String webhookSecret,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
            @Value("${didit.expected-environment:}") String expectedEnvironment,
            @Value("${didit.required-features:ID_VERIFICATION,LIVENESS,FACE_MATCH}") String requiredFeatures) {
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.workflowId = workflowId == null ? "" : workflowId.trim();
        this.webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
        this.frontendUrl = trimTrailingSlash(frontendUrl);
        this.expectedEnvironment = expectedEnvironment == null ? "" : expectedEnvironment.trim();
        this.requiredFeatures = Arrays.stream(requiredFeatures.split(","))
                .map(String::trim).filter(value -> !value.isEmpty())
                .map(String::toUpperCase).collect(Collectors.toUnmodifiableSet());
    }

    public void requireSessionConfiguration() {
        if (baseUrl.isBlank() || apiKey.isBlank() || workflowId.isBlank() || frontendUrl.isBlank()) {
            throw new IllegalStateException("Didit session configuration is incomplete.");
        }
    }

    public void requireWebhookConfiguration() {
        if (webhookSecret.isBlank()) throw new IllegalStateException("Didit webhook secret is not configured.");
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) return "";
        return value.trim().replaceAll("/+$", "");
    }
}
