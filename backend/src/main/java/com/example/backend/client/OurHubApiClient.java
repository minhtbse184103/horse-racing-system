package com.example.backend.client;

import com.example.backend.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;

@Component
public class OurHubApiClient {

    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String baseUrl;
    private final String apiKey;

    public OurHubApiClient(
            ObjectMapper objectMapper,
            @Value("${ourhub.api.base-url:http://racing.ourhub.site}") String baseUrl,
            @Value("${ourhub.api.key:${OURHUB_API_KEY:}}") String apiKey
    ) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(REQUEST_TIMEOUT)
                .build();
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    public JsonNode getCourseInfo(LocalDate date) {
        if (apiKey.isBlank()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "OurHub API key is not configured."
            );
        }

        String encodedDate = URLEncoder.encode(
                date.toString(),
                StandardCharsets.UTF_8
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/course-info/" + encodedDate))
                .timeout(REQUEST_TIMEOUT)
                .header("X-API-Key", apiKey)
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (isNoDataResponse(response)) {
                return objectMapper.createArrayNode();
            }

            if (response.statusCode() >= 400) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "Unable to fetch OurHub course information."
                );
            }

            return objectMapper.readTree(response.body());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "OurHub request was interrupted."
            );
        } catch (IOException | IllegalArgumentException exception) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to connect to OurHub Racing API."
            );
        }
    }

    private boolean isNoDataResponse(HttpResponse<String> response) {
        if (response.statusCode() != 404) {
            return false;
        }

        try {
            JsonNode body = objectMapper.readTree(response.body());
            JsonNode detail = body.get("detail");

            return detail != null
                    && detail.isTextual()
                    && "No data".equalsIgnoreCase(detail.asText().trim());
        } catch (IOException exception) {
            return false;
        }
    }

    private String normalizeBaseUrl(String value) {
        String normalized = value == null || value.isBlank()
                ? "http://racing.ourhub.site"
                : value.trim();

        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }
}
