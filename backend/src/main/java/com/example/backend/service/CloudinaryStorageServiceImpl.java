package com.example.backend.service;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.exception.ApiException;

@Service
public class CloudinaryStorageServiceImpl implements ImageStorageService {
    private static final long MAX_IMAGE_SIZE = 2 * 1024 * 1024;
    private static final String UPLOAD_FOLDER = "horse-racing-system";
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/svg+xml");

    private final RestClient restClient;
    private final String cloudinaryUrl;

    public CloudinaryStorageServiceImpl(@Value("${cloudinary.url}") String cloudinaryUrl) {
        this.restClient = RestClient.create();
        this.cloudinaryUrl = cloudinaryUrl;
    }

    @Override
    public String uploadImage(MultipartFile file) {
        validateImage(file);

        CloudinaryCredentials credentials = parseCredentials(cloudinaryUrl);
        long timestamp = System.currentTimeMillis() / 1000;
        String signature = signUpload(timestamp, credentials.apiSecret());
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", toResource(file));
        body.add("api_key", credentials.apiKey());
        body.add("timestamp", String.valueOf(timestamp));
        body.add("folder", UPLOAD_FOLDER);
        body.add("signature", signature);

        Map<?, ?> response = restClient.post()
                .uri("https://api.cloudinary.com/v1_1/{cloudName}/image/upload", credentials.cloudName())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, cloudinaryResponse) -> {
                            throw new ApiException(HttpStatus.BAD_GATEWAY, "Unable to upload image to Cloudinary.");
                        })
                .body(Map.class);

        Object secureUrl = response == null ? null : response.get("secure_url");
        if (secureUrl == null || String.valueOf(secureUrl).isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Cloudinary did not return an image URL.");
        }

        return String.valueOf(secureUrl);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file is required.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file must not exceed 2MB.");
        }

        String contentType = file.getContentType();
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file must be PNG, JPG, WEBP, or SVG.");
        }
    }

    private ByteArrayResource toResource(MultipartFile file) {
        try {
            return new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return getSafeFilename(file.getOriginalFilename());
                }
            };
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read image file.");
        }
    }

    private String getSafeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "image";
        }

        return filename.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private String signUpload(long timestamp, String apiSecret) {
        String payload = "folder=" + UPLOAD_FOLDER
                + "&timestamp=" + timestamp
                + apiSecret;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(digest.digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to sign Cloudinary upload.");
        }
    }

    private CloudinaryCredentials parseCredentials(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cloudinary URL is not configured.");
        }

        URI uri;
        try {
            uri = URI.create(normalizeCloudinaryUrl(cloudinaryUrl));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cloudinary URL is invalid.");
        }
        if (!"cloudinary".equalsIgnoreCase(uri.getScheme())) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cloudinary URL is invalid.");
        }

        String userInfo = uri.getUserInfo();
        String cloudName = uri.getHost();
        if (userInfo == null || cloudName == null || cloudName.isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cloudinary credentials are invalid.");
        }

        List<String> credentialParts = List.of(userInfo.split(":", 2));
        if (credentialParts.size() != 2
                || credentialParts.get(0).isBlank()
                || credentialParts.get(1).isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cloudinary credentials are invalid.");
        }

        return new CloudinaryCredentials(credentialParts.get(0), credentialParts.get(1), cloudName);
    }

    private String normalizeCloudinaryUrl(String cloudinaryUrl) {
        return cloudinaryUrl.trim()
                .replace("<", "")
                .replace(">", "")
                .replaceAll("\\.+$", "");
    }

    private record CloudinaryCredentials(String apiKey, String apiSecret, String cloudName) {
    }
}
