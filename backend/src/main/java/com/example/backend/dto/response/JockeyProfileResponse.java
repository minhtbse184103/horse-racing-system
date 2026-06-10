package com.example.backend.dto.response;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JockeyProfileResponse {
    private Integer jockeyId;
    private String fullName;
    private String email;
    private String licenseNo;
    private BigDecimal weight;
    private String ranking;
    private String status;
    private String imgUrl;
}
