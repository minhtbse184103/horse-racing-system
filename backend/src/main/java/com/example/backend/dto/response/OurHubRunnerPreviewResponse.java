package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OurHubRunnerPreviewResponse {

    private String horseName;
    private String jockeyName;
}
