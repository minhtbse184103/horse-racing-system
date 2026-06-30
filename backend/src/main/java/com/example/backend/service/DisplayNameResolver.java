package com.example.backend.service;

import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.OwnerApplication;
import com.example.backend.entity.User;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.OwnerApplicationRepository;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DisplayNameResolver {

    private final OwnerApplicationRepository ownerApplicationRepository;
    private final JockeyProfileRepository jockeyProfileRepository;

    public DisplayNameResolver(
            OwnerApplicationRepository ownerApplicationRepository,
            JockeyProfileRepository jockeyProfileRepository
    ) {
        this.ownerApplicationRepository = ownerApplicationRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
    }

    public Map<Integer, String> resolveOwnerNames(
            Collection<Integer> userIds
    ) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }

        return ownerApplicationRepository.findLatestByUserIds(userIds)
                .stream()
                .collect(Collectors.toMap(
                        OwnerApplication::getUserId,
                        OwnerApplication::getFullName,
                        (current, ignored) -> current
                ));
    }

    public Map<Integer, String> resolveJockeyNames(
            Collection<Integer> userIds
    ) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }

        return jockeyProfileRepository.findByJockeyIdIn(userIds)
                .stream()
                .collect(Collectors.toMap(
                        JockeyProfile::getJockeyId,
                        JockeyProfile::getFullName,
                        (current, ignored) -> current
                ));
    }

    public String getOwnerDisplayName(User owner) {
        if (owner == null) {
            return null;
        }

        return ownerApplicationRepository
                .findFirstByUserIdOrderByApplicationIdDesc(owner.getUserID())
                .map(OwnerApplication::getFullName)
                .filter(name -> !name.isBlank())
                .orElse(owner.getUsername());
    }

    public String getOwnerDisplayName(
            User owner,
            Map<Integer, String> ownerNames
    ) {
        if (owner == null) {
            return null;
        }

        String fullName = ownerNames.get(owner.getUserID());
        if (fullName == null || fullName.isBlank()) {
            return owner.getUsername();
        }
        return fullName;
    }

    public String getJockeyDisplayName(User jockey) {
        if (jockey == null) {
            return null;
        }

        return jockeyProfileRepository
                .findById(jockey.getUserID())
                .map(JockeyProfile::getFullName)
                .filter(name -> !name.isBlank())
                .orElse(jockey.getUsername());
    }

    public String getJockeyDisplayName(
            User jockey,
            Map<Integer, String> jockeyNames
    ) {
        if (jockey == null) {
            return null;
        }

        String fullName = jockeyNames.get(jockey.getUserID());
        if (fullName == null || fullName.isBlank()) {
            return jockey.getUsername();
        }
        return fullName;
    }
}
