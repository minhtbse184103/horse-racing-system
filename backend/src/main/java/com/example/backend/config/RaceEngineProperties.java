package com.example.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "race.engine")
public class RaceEngineProperties {

    private String unityExecutablePath;
    private String backendBaseUrl = "http://localhost:8080";
}
