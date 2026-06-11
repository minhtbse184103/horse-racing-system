package com.example.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.service.OwnerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/owner/horses")
@PreAuthorize("hasRole('OWNER')")
public class OwnerHorseController {
    private final OwnerService ownerService;

    public OwnerHorseController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    // Lấy danh sách toàn bộ ngựa thuộc owner đang đăng nhập.
    @GetMapping
    public List<HorseResponse> getMyHorses() {
        return ownerService.getMyHorses();
    }

    // Lấy chi tiết một con ngựa thuộc owner theo horseId.
    @GetMapping("/{horseId}")
    public HorseResponse getMyHorseById(@PathVariable Integer horseId) {
        return ownerService.getMyHorseById(horseId);
    }

    // Tạo mới hồ sơ ngựa cho owner đang đăng nhập.
    @PostMapping
    public ResponseEntity<HorseResponse> createHorse(@Valid @RequestBody CreateHorseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ownerService.createHorse(request));
    }

    // Cập nhật thông tin một con ngựa thuộc owner.
    @PutMapping("/{horseId}")
    public HorseResponse updateHorse(
            @PathVariable Integer horseId,
            @Valid @RequestBody UpdateHorseRequest request) {
        return ownerService.updateHorse(horseId, request);
    }

    // Xóa ngựa của owner nếu ngựa không còn registration active.
    @DeleteMapping("/{horseId}")
    public ResponseEntity<Void> deleteHorse(@PathVariable Integer horseId) {
        ownerService.deleteHorse(horseId);
        return ResponseEntity.noContent().build();
    }
}
