package com.example.backend.client;

import com.example.backend.config.DiditProperties;
import com.example.backend.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class DiditClient {
    private final DiditProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    public JsonNode createSession(String vendorData) {
        properties.requireSessionConfiguration();
        ObjectNode body = objectMapper.createObjectNode();
        body.put("workflow_id", properties.getWorkflowId());
        body.put("vendor_data", vendorData);
        body.put("callback", properties.getFrontendUrl() + "/wallet/kyc/result");
        return send("/v3/session/", "POST", body.toString());
    }

    public JsonNode retrieveDecision(String sessionId) {
        properties.requireSessionConfiguration();
        return send("/v3/session/" + sessionId + "/decision/", "GET", null);
    }

    private JsonNode send(String path, String method, String body) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(properties.getBaseUrl() + path))
                    .timeout(Duration.ofSeconds(15))
                    .header("x-api-key", properties.getApiKey())
                    .header("Accept", "application/json");
            if (body == null) builder.GET();
            else builder.header("Content-Type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(body));
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Didit request failed.");
            }
            return objectMapper.readTree(response.body());
        } catch (ApiException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Didit request was interrupted.");
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Cannot communicate with Didit.");
        }
    }
}
