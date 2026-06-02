package com.example.backend.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationResponse {
    private Integer registrationID;
    private Integer raceID;
    private Integer horseID;
    private String horseName;
    private Integer ownerID;
    private String status;
    private LocalDateTime registrationDate;
    private LocalDateTime createdAt;
}
