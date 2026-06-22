package com.example.backend.service;

import com.example.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class VenueImageStorageService {

    static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final String PUBLIC_PREFIX = "/uploads/tournament-venues/";
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final Path storageDirectory;

    public VenueImageStorageService() {
        this(Paths.get("uploads", "tournament-venues"));
    }

    VenueImageStorageService(Path storageDirectory) {
        this.storageDirectory = storageDirectory.toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        validate(file);

        String extension = ALLOWED_TYPES.get(file.getContentType());
        String filename = UUID.randomUUID() + extension;
        Path destination = storageDirectory.resolve(filename).normalize();

        if (!destination.getParent().equals(storageDirectory)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid venue image path.");
        }

        try {
            Files.createDirectories(storageDirectory);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return PUBLIC_PREFIX + filename;
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Venue image could not be stored.");
        }
    }

    public void delete(String publicPath) {
        if (publicPath == null || !publicPath.startsWith(PUBLIC_PREFIX)) {
            return;
        }

        String filename = publicPath.substring(PUBLIC_PREFIX.length());
        Path target = storageDirectory.resolve(filename).normalize();

        if (!target.getParent().equals(storageDirectory)) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Venue image could not be removed.");
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Venue image file is required.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Venue image must not exceed 5MB.");
        }

        if (!ALLOWED_TYPES.containsKey(file.getContentType())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Venue image must be JPEG, PNG, or WebP.");
        }
    }
}
