package com.example.backend.service;

import com.example.backend.client.OurHubApiClient;
import com.example.backend.dto.response.OurHubRacePreviewResponse;
import com.example.backend.dto.response.OurHubRunnerPreviewResponse;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OurHubRacingImportService {

    private static final Pattern METER_PATTERN =
            Pattern.compile("(\\d{3,5})\\s*(m|meter|metre|meters|metres)?", Pattern.CASE_INSENSITIVE);
    private static final Pattern TIME_PATTERN =
            Pattern.compile("\\b(\\d{1,2}:\\d{2})(?::\\d{2})?\\b");

    private final OurHubApiClient ourHubApiClient;
    private final UserRepository userRepository;

    public OurHubRacingImportService(
            OurHubApiClient ourHubApiClient,
            UserRepository userRepository
    ) {
        this.ourHubApiClient = ourHubApiClient;
        this.userRepository = userRepository;
    }

    public List<OurHubRacePreviewResponse> getCourseInfoPreview(
            LocalDate date,
            String adminEmail
    ) {
        getAdmin(adminEmail);

        JsonNode root = ourHubApiClient.getCourseInfo(date);
        List<RaceNode> raceNodes = findRaceNodes(root);

        return raceNodes.stream()
                .map(raceNode -> toPreview(raceNode, root, date))
                .filter(preview -> preview.getRaceName() != null
                        || preview.getCourseName() != null
                        || preview.getRaceStartTime() != null)
                .toList();
    }

    private OurHubRacePreviewResponse toPreview(
            RaceNode race,
            JsonNode root,
            LocalDate fallbackDate
    ) {
        JsonNode raceNode = race.node();

        LocalDate raceDate = parseDate(firstText(
                raceNode,
                root,
                "raceDate",
                "date",
                "meetingDate",
                "courseDate"
        ), fallbackDate);

        String raceTime = normalizeTime(firstText(
                raceNode,
                null,
                "raceTime",
                "race_time",
                "offTime",
                "off_time",
                "time",
                "startTime",
                "start_time",
                "scheduledTime"
        ));

        LocalDateTime raceStartTime = parseDateTime(
                firstText(raceNode, null, "raceStartTime", "startDateTime", "scheduledDateTime"),
                raceDate,
                raceTime
        );

        String distanceText = firstText(
                raceNode,
                null,
                "distanceText",
                "distance_text",
                "distance",
                "raceDistance",
                "race_distance",
                "trip"
        );
        Integer distanceMeters = firstInteger(
                raceNode,
                "distanceMeters",
                "distance_meters",
                "distanceInMeters",
                "distance_in_meters",
                "meters",
                "metres"
        );
        if (distanceMeters == null) {
            distanceMeters = parseDistanceMeters(distanceText);
        }

        List<OurHubRunnerPreviewResponse> runners = extractRunners(raceNode);
        Integer runnerCount = firstInteger(
                raceNode,
                "runnerCount",
                "runner_count",
                "numberOfRunners",
                "number_of_runners",
                "runnersCount",
                "runners_count",
                "fieldSize"
        );
        if (runnerCount == null && !runners.isEmpty()) {
            runnerCount = runners.size();
        }

        return OurHubRacePreviewResponse.builder()
                .externalRaceId(firstText(raceNode, null, "externalRaceId", "external_race_id", "raceId", "raceID", "race_id", "id"))
                .raceName(firstText(raceNode, null, "raceName", "race_name", "name", "title", "raceTitle", "race_title", "race"))
                .courseName(firstNonBlank(
                        firstText(raceNode, root, "courseName", "course_name", "course", "track", "trackName", "track_name", "venue"),
                        race.courseName()
                ))
                .raceDate(raceDate)
                .raceTime(raceTime)
                .raceStartTime(raceStartTime)
                .distanceText(distanceText)
                .distanceMeters(distanceMeters)
                .runnerCount(runnerCount)
                .runners(runners)
                .build();
    }

    private List<RaceNode> findRaceNodes(JsonNode root) {
        List<RaceNode> raceNodes = new ArrayList<>();

        collectRaceNodes(root, raceNodes, new LinkedHashSet<>(), null);

        return raceNodes;
    }

    private void collectRaceNodes(
            JsonNode node,
            List<RaceNode> raceNodes,
            Set<JsonNode> seen,
            String courseName
    ) {
        if (node == null || node.isNull() || seen.contains(node)) {
            return;
        }

        seen.add(node);

        if (node.isObject() && looksLikeRace(node)) {
            raceNodes.add(new RaceNode(node, courseName));
            return;
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                collectRaceNodes(child, raceNodes, seen, courseName);
            }
            return;
        }

        if (node.isObject()) {
            node.fields().forEachRemaining(entry ->
                    collectRaceNodes(
                            entry.getValue(),
                            raceNodes,
                            seen,
                            inferCourseName(entry.getKey(), entry.getValue(), courseName)
                    )
            );
        }
    }

    private boolean looksLikeRace(JsonNode node) {
        return hasAny(node, "raceName", "race_name", "raceTitle", "race_title", "offTime", "off_time", "raceTime", "race_time")
                || (hasAny(node, "runners", "entries", "horses", "participants")
                && hasAny(node, "course", "courseName", "course_name", "track", "trackName", "track_name", "name", "title"));
    }

    private String inferCourseName(
            String fieldName,
            JsonNode fieldValue,
            String currentCourseName
    ) {
        if (currentCourseName != null || fieldName == null || fieldValue == null) {
            return currentCourseName;
        }

        if (fieldValue.isArray()
                && fieldValue.size() > 0
                && fieldValue.get(0).isObject()
                && looksLikeRace(fieldValue.get(0))) {
            return fieldName;
        }

        return currentCourseName;
    }

    private List<OurHubRunnerPreviewResponse> extractRunners(JsonNode raceNode) {
        JsonNode runnersNode = firstNode(
                raceNode,
                "runners",
                "entries",
                "horses",
                "participants"
        );

        if (runnersNode == null || !runnersNode.isArray()) {
            return List.of();
        }

        List<OurHubRunnerPreviewResponse> runners = new ArrayList<>();

        for (JsonNode runnerNode : runnersNode) {
            runners.add(OurHubRunnerPreviewResponse.builder()
                    .horseName(firstText(runnerNode, null, "horseName", "horse_name", "runnerName", "runner_name", "name", "horse"))
                    .jockeyName(firstText(runnerNode, null, "jockeyName", "jockey_name", "jockey", "rider"))
                    .build());
        }

        return runners;
    }

    private String firstText(JsonNode primary, JsonNode secondary, String... fields) {
        String value = firstTextFromNode(primary, fields);
        if (value != null) {
            return value;
        }
        return firstTextFromNode(secondary, fields);
    }

    private String firstTextFromNode(JsonNode node, String... fields) {
        JsonNode value = firstNode(node, fields);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isTextual()) {
            String text = value.asText().trim();
            return text.isEmpty() ? null : text;
        }
        if (value.isNumber() || value.isBoolean()) {
            return value.asText();
        }
        return null;
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }

    private Integer firstInteger(JsonNode node, String... fields) {
        JsonNode value = firstNode(node, fields);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.canConvertToInt()) {
            return value.asInt();
        }
        if (value.isTextual()) {
            try {
                return Integer.parseInt(value.asText().trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private JsonNode firstNode(JsonNode node, String... fields) {
        if (node == null || node.isNull()) {
            return null;
        }

        for (String field : fields) {
            JsonNode direct = node.get(field);
            if (direct != null && !direct.isNull()) {
                return direct;
            }
        }

        return null;
    }

    private boolean hasAny(JsonNode node, String... fields) {
        for (String field : fields) {
            if (node.has(field)) {
                return true;
            }
        }
        return false;
    }

    private LocalDate parseDate(String value, LocalDate fallback) {
        if (value == null) {
            return fallback;
        }

        try {
            return LocalDate.parse(value.substring(0, Math.min(10, value.length())));
        } catch (DateTimeParseException | IndexOutOfBoundsException exception) {
            return fallback;
        }
    }

    private LocalDateTime parseDateTime(
            String dateTimeText,
            LocalDate raceDate,
            String raceTime
    ) {
        if (dateTimeText != null) {
            try {
                return LocalDateTime.parse(dateTimeText);
            } catch (DateTimeParseException ignored) {
                String normalizedTime = normalizeTime(dateTimeText);
                if (normalizedTime != null) {
                    return LocalDateTime.of(raceDate, LocalTime.parse(normalizedTime));
                }
            }
        }

        if (raceTime == null) {
            return null;
        }

        try {
            return LocalDateTime.of(raceDate, LocalTime.parse(raceTime));
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String normalizeTime(String value) {
        if (value == null) {
            return null;
        }

        Matcher matcher = TIME_PATTERN.matcher(value.trim());
        if (!matcher.find()) {
            return null;
        }

        String time = matcher.group(1);
        String[] parts = time.split(":");
        return String.format("%02d:%s", Integer.parseInt(parts[0]), parts[1]);
    }

    private Integer parseDistanceMeters(String value) {
        if (value == null) {
            return null;
        }

        Matcher matcher = METER_PATTERN.matcher(value);
        if (!matcher.find()) {
            return null;
        }

        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private User getAdmin(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated administrator does not exist."
                ));

        if (admin.getRole() == null
                || !"ADMIN".equalsIgnoreCase(admin.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can import external racing data."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(admin.getStatus())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Administrator account is not active."
            );
        }

        return admin;
    }

    private record RaceNode(JsonNode node, String courseName) {
    }
}
