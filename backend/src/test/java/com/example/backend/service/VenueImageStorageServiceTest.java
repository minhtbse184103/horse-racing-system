package com.example.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.example.backend.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class VenueImageStorageServiceTest {

    @Test
    void storeRejectsNonImageFile() {
        Cloudinary cloudinary = mock(Cloudinary.class);
        VenueImageStorageService service = new VenueImageStorageService(cloudinary);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "venue.txt",
                "text/plain",
                "not an image".getBytes()
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.store(1, file)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void storeRejectsFileLargerThanFiveMegabytes() {
        Cloudinary cloudinary = mock(Cloudinary.class);
        VenueImageStorageService service = new VenueImageStorageService(cloudinary);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "venue.jpg",
                "image/jpeg",
                new byte[(int) VenueImageStorageService.MAX_FILE_SIZE + 1]
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.store(1, file)
        );

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, exception.getStatus());
    }

    @Test
    void storeReturnsCloudinarySecureUrl() throws IOException {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(Map.of(
                        "secure_url",
                        "https://res.cloudinary.com/demo/image/upload/tournament-1.png"
                ));

        VenueImageStorageService service = new VenueImageStorageService(cloudinary);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "venue.png",
                "image/png",
                new byte[]{1, 2, 3}
        );

        String imageUrl = service.store(1, file);

        assertEquals(
                "https://res.cloudinary.com/demo/image/upload/tournament-1.png",
                imageUrl
        );

        verify(uploader).upload(any(byte[].class), anyMap());
    }

    @Test
    void storeThrowsServerErrorWhenCloudinaryDoesNotReturnUrl() throws IOException {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(Map.of());

        VenueImageStorageService service = new VenueImageStorageService(cloudinary);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "venue.png",
                "image/png",
                new byte[]{1, 2, 3}
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.store(1, file)
        );

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatus());
    }

    @Test
    void deleteDestroysCloudinaryTournamentImage() throws IOException {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(any(String.class), anyMap()))
                .thenReturn(Map.of("result", "ok"));

        VenueImageStorageService service = new VenueImageStorageService(cloudinary);

        service.delete(1);

        verify(uploader).destroy(
                "horse-racing-system/tournament-venues/tournament-1",
                Map.of(
                        "resource_type", "image",
                        "invalidate", true
                )
        );
    }

    @Test
    void allowsWebpImages() throws IOException {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(Map.of(
                        "secure_url",
                        "https://res.cloudinary.com/demo/image/upload/tournament-1.webp"
                ));

        VenueImageStorageService service = new VenueImageStorageService(cloudinary);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "venue.webp",
                "image/webp",
                new byte[]{1, 2, 3}
        );

        String imageUrl = service.store(1, file);

        assertTrue(imageUrl.endsWith(".webp"));
    }
}