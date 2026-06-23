package com.example.backend.client;

import com.example.backend.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OurHubApiClientTest {

    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void getCourseInfoReturnsEmptyArrayWhenOurHubSaysNoData() throws IOException {
        startServer(404, "{\"detail\":\"No data\"}");

        OurHubApiClient client = new OurHubApiClient(
                new ObjectMapper(),
                baseUrl(),
                "test-key"
        );

        JsonNode result = client.getCourseInfo(LocalDate.of(2026, 7, 1));

        assertTrue(result.isArray());
        assertEquals(0, result.size());
    }

    @Test
    void getCourseInfoKeepsOther404ResponsesAsUpstreamFailure() throws IOException {
        startServer(404, "{\"detail\":\"Unauthorized\"}");

        OurHubApiClient client = new OurHubApiClient(
                new ObjectMapper(),
                baseUrl(),
                "test-key"
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> client.getCourseInfo(LocalDate.of(2026, 7, 1))
        );

        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatus());
    }

    private void startServer(int statusCode, String responseBody) throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/api/course-info/2026-07-01", exchange -> {
            byte[] body = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(statusCode, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
    }

    private String baseUrl() {
        return "http://localhost:" + server.getAddress().getPort();
    }
}
