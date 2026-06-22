package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FileUploadResponse {
    private String url;
    private String publicId;
    private String originalFilename;
    private String contentType;
    private Long size;
}
