package com.example.backend.dto.request;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHorseRequest {
    private String name;
    
    private String breed;
    
    private Integer age;
    
    private Double weight;
    
    private LocalDate healthCertExpiry;
    
    private String status;
}
