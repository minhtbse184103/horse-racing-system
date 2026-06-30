package com.example.backend.service;

import com.example.backend.config.RaceEngineProperties;
import com.example.backend.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.List;

@Slf4j
@Component
public class RaceEngineProcessLauncher {

    private final RaceEngineProperties properties;

    public RaceEngineProcessLauncher(RaceEngineProperties properties) {
        this.properties = properties;
    }

    public void launch(Integer raceId, String launchToken) {
        String executablePath = properties.getUnityExecutablePath();
        if (executablePath == null || executablePath.trim().isEmpty()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unity race engine executable path is not configured."
            );
        }

        File executable = new File(executablePath);
        if (!executable.isFile()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unity race engine executable does not exist."
            );
        }

        List<String> command = List.of(
                executable.getAbsolutePath(),
                "--raceId=" + raceId,
                "--apiKey=" + launchToken,
                "--backendUrl=" + properties.getBackendBaseUrl()
        );

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.directory(executable.getParentFile());

        try {
            processBuilder.start();
            log.info("Unity race engine process started for raceId={}.", raceId);
        } catch (IOException exception) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to start Unity race engine process."
            );
        }
    }
}
