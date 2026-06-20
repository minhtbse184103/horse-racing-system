package com.example.backend.controller;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.service.UploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "Upload", description = "API upload file lên Cloudinary")
@org.springframework.web.bind.annotation.CrossOrigin(origins = "*")
public class UploadController {

    private final UploadService uploadService;

    @PostMapping
    @Operation(summary = "Upload file lên Cloudinary")
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String url = uploadService.uploadFile(file);
            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .status(true)
                    .message("Upload thành công")
                    .data(url)
                    .build());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.<String>builder()
                    .status(false)
                    .message("Lỗi upload: " + e.getMessage())
                    .build());
        }
    }
}
