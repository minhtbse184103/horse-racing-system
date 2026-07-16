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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RaceTrackImageStorageServiceTest {

    @Test
    void storeRejectsNonImageFile() {
        Cloudinary cloudinary = mock(Cloudinary.class);
        RaceTrackImageStorageService service =
                new RaceTrackImageStorageService(cloudinary);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "track.txt",
                "text/plain",
                "not an image".getBytes()
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.store(8, file)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void storeReturnsCloudinarySecureUrl() throws IOException {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(Map.of(
                        "secure_url",
                        "https://res.cloudinary.com/demo/image/upload/race-8.png"
                ));

        RaceTrackImageStorageService service =
                new RaceTrackImageStorageService(cloudinary);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "track.png",
                "image/png",
                new byte[]{1, 2, 3}
        );

        String imageUrl = service.store(8, file);

        assertEquals(
                "https://res.cloudinary.com/demo/image/upload/race-8.png",
                imageUrl
        );
        verify(uploader).upload(any(byte[].class), anyMap());
    }

    @Test
    void deleteDestroysCloudinaryRaceTrackImage() throws IOException {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(any(String.class), anyMap()))
                .thenReturn(Map.of("result", "ok"));

        RaceTrackImageStorageService service =
                new RaceTrackImageStorageService(cloudinary);

        service.delete(8);

        verify(uploader).destroy(
                "horse-racing-system/race-tracks/race-8",
                Map.of(
                        "resource_type", "image",
                        "invalidate", true
                )
        );
    }
}
