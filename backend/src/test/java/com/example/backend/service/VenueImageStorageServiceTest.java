package com.example.backend.service;

import com.example.backend.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VenueImageStorageServiceTest {

    @TempDir
    Path tempDirectory;

    @Test
    void storeRejectsNonImageFile() {
        VenueImageStorageService service = new VenueImageStorageService(tempDirectory);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "venue.txt",
                "text/plain",
                "not an image".getBytes()
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.store(file)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void storeRejectsFileLargerThanFiveMegabytes() {
        VenueImageStorageService service = new VenueImageStorageService(tempDirectory);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "venue.jpg",
                "image/jpeg",
                new byte[(int) VenueImageStorageService.MAX_FILE_SIZE + 1]
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.store(file)
        );

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, exception.getStatus());
    }

    @Test
    void storeCreatesSafeUniqueImagePath() {
        VenueImageStorageService service = new VenueImageStorageService(tempDirectory);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../../unsafe-name.png",
                "image/png",
                new byte[]{1, 2, 3}
        );

        String publicPath = service.store(file);
        String filename = publicPath.substring(publicPath.lastIndexOf('/') + 1);

        assertTrue(publicPath.startsWith("/uploads/tournament-venues/"));
        assertTrue(filename.endsWith(".png"));
        assertTrue(Files.exists(tempDirectory.resolve(filename)));
    }
}
