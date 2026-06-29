package com.example.backend.service;

import com.example.backend.entity.Race;
import com.example.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class RaceEngineTokenService {

    private static final int TOKEN_BYTES = 32;
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public void validateToken(Race race, String providedToken) {
        String expectedToken = race.getRaceEngineToken();

        if (expectedToken == null
                || expectedToken.isBlank()
                || providedToken == null
                || providedToken.isBlank()
                || !constantTimeEquals(expectedToken, providedToken)) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid or expired race engine launch token."
            );
        }
    }

    private boolean constantTimeEquals(String expected, String provided) {
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = provided.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expectedBytes, providedBytes);
    }
}
