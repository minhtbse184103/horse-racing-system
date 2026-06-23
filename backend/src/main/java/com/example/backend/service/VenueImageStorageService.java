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
public class VenueImageStorageService {

    static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final String FOLDER =
            "horse-racing-system/tournament-venues";

    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    private final Cloudinary cloudinary;

    public VenueImageStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String store(Integer tournamentId, MultipartFile file) {
        validate(file);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                            "folder", FOLDER,
                            "public_id", "tournament-" + tournamentId,
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
                    "Không thể tải hình địa điểm lên Cloudinary."
            );
        }
    }

    public void delete(Integer tournamentId) {
        try {
            cloudinary.uploader().destroy(
                    FOLDER + "/tournament-" + tournamentId,
                    Map.of(
                            "resource_type", "image",
                            "invalidate", true
                    )
            );
        } catch (IOException exception) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể xóa hình địa điểm trên Cloudinary."
            );
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn hình địa điểm."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Hình địa điểm không được vượt quá 5MB."
            );
        }

        String contentType = file.getContentType();
        if (contentType == null
                || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Hình địa điểm phải là JPEG, PNG hoặc WebP."
            );
        }
    }
}