package com.example.backend.service;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.example.backend.dto.response.FileUploadResponse;
import com.example.backend.exception.ApiException;

@Service
public class FileUploadService {
    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

    private final Cloudinary cloudinary;

    public FileUploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public FileUploadResponse upload(MultipartFile file, String folder) {
        String targetFolder = normalizeFolder(folder);
        validateFile(file, targetFolder);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                            "folder", targetFolder,
                            "resource_type", "auto"));

            return FileUploadResponse.builder()
                    .url(String.valueOf(result.get("secure_url")))
                    .publicId(String.valueOf(result.get("public_id")))
                    .originalFilename(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .size(file.getSize())
                    .build();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the upload file.");
        }
    }

    private void validateFile(MultipartFile file, String targetFolder) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File upload la bat buoc.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File upload khong duoc vuot qua 10MB.");
        }

        String contentType = String.valueOf(file.getContentType()).toLowerCase();
        String extension = getFileExtension(file.getOriginalFilename());
        boolean isJpgOrPng = ("image/jpeg".equals(contentType) || "image/png".equals(contentType))
                && ("jpg".equals(extension) || "jpeg".equals(extension) || "png".equals(extension));
        boolean isPdf = "application/pdf".equals(contentType) && "pdf".equals(extension);

        if (targetFolder.endsWith("/owner-identity")) {
            if (!isJpgOrPng) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Giay to owner chi ho tro JPG hoac PNG.");
            }
            return;
        }

        if (!isJpgOrPng && !isPdf) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File chi ho tro PDF, JPG hoac PNG.");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isBlank() || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private String normalizeFolder(String folder) {
        String normalized = folder == null ? "" : folder.trim().toLowerCase();
        if (normalized.isBlank()) {
            return "horse-racing-system";
        }
        return "horse-racing-system/" + normalized.replaceAll("[^a-z0-9_-]+", "-");
    }
}
