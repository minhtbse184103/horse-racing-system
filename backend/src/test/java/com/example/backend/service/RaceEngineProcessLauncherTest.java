package com.example.backend.service;

import com.example.backend.config.RaceEngineProperties;
import com.example.backend.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RaceEngineProcessLauncherTest {

    @TempDir
    Path tempDirectory;

    @Test
    void launchStartsExecutableWithRaceArguments() throws Exception {
        Path outputFile = tempDirectory.resolve("args.txt");
        Path executable = tempDirectory.resolve("fake-unity.cmd");
        Files.writeString(
                executable,
                "@echo off\r\n"
                        + "echo %* > \"" + outputFile + "\"\r\n"
        );

        RaceEngineProperties properties = new RaceEngineProperties();
        properties.setUnityExecutablePath(executable.toString());
        properties.setBackendBaseUrl("http://localhost:8080");

        RaceEngineProcessLauncher launcher = new RaceEngineProcessLauncher(properties);
        launcher.launch(6, "launch-token");

        waitForFile(outputFile);
        String args = Files.readString(outputFile);

        assertTrue(args.contains("--raceId=6"));
        assertTrue(args.contains("--apiKey=launch-token"));
        assertTrue(args.contains("--backendUrl=http://localhost:8080"));
    }

    @Test
    void launchRejectsMissingExecutablePath() {
        RaceEngineProperties properties = new RaceEngineProperties();
        RaceEngineProcessLauncher launcher = new RaceEngineProcessLauncher(properties);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> launcher.launch(6, "launch-token")
        );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
    }

    @Test
    void launchRejectsMissingExecutableFile() {
        RaceEngineProperties properties = new RaceEngineProperties();
        properties.setUnityExecutablePath(tempDirectory.resolve("missing.exe").toString());
        RaceEngineProcessLauncher launcher = new RaceEngineProcessLauncher(properties);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> launcher.launch(6, "launch-token")
        );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
    }

    private void waitForFile(Path file) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
        while (System.nanoTime() < deadline) {
            if (Files.exists(file)) {
                return;
            }
            Thread.sleep(50);
        }
        throw new AssertionError("Process did not write expected argument file.");
    }
}
