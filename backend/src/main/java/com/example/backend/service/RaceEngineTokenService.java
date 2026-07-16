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
        // FLOW: Admin Launch Unity Race
        // ORDER: 6/9 - Token service creates the per-launch secret passed only to Unity and stored on Race.
        // Purpose: create a random per-launch token stored on Race and passed to Unity when the process starts.
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public void validateToken(Race race, String providedToken) {
        // FLOW: Admin Launch Unity Race
        // FLOW: Admin Live Race Data
        // ORDER: 3/10 - Token validation proves lineup/tick/result requests belong to the active launched Race session.
        // Purpose: Unity live/result endpoints use this token to prove they belong to the launched Race session.
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
