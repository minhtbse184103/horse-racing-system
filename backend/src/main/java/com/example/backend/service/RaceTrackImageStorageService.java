package com.example.backend.service;

import com.cloudinary.Cloudinary;
import com.example.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class RaceTrackImageStorageService {

    static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final String FOLDER =
            "horse-racing-system/race-tracks";

    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    private final Cloudinary cloudinary;

    public RaceTrackImageStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String store(Integer raceId, MultipartFile file) {
        // FLOW: Admin Tournament Images
        // ORDER: 6R/7 - Storage service validates and uploads Race track image to Cloudinary.
        // Storage: validates the Race track image and uploads it to Cloudinary using a stable race public_id.
        validate(file);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                            "folder", FOLDER,
                            "public_id", "race-" + raceId,
                            "resource_type", "image",
                            "overwrite", true,
                            "invalidate", true
                    )
            );

            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new ApiException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Cloudinary không trả về URL hình ảnh."
                );
            }

            return secureUrl.toString();
        } catch (IOException exception) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể tải hình đường đua lên Cloudinary."
            );
        }
    }

    public void delete(Integer raceId) {
        // FLOW: Admin Tournament Images
        // ORDER: 6R/7 - Storage service deletes the Race track image object from Cloudinary.
        // Storage: removes the Cloudinary track image object for this Race.
        try {
            cloudinary.uploader().destroy(
                    FOLDER + "/race-" + raceId,
                    Map.of(
                            "resource_type", "image",
                            "invalidate", true
                    )
            );
        } catch (IOException exception) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể xóa hình đường đua trên Cloudinary."
            );
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn hình đường đua."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Hình đường đua không được vượt quá 5MB."
            );
        }

        String contentType = file.getContentType();
        if (contentType == null
                || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Hình đường đua phải là JPEG, PNG hoặc WebP."
            );
        }
    }
}
