package com.example.backend.service;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RaceCategoryService {

    private final RaceCategoryRepository raceCategoryRepository;

    public RaceCategoryService(RaceCategoryRepository raceCategoryRepository) {
        this.raceCategoryRepository = raceCategoryRepository;
    }

    public List<RaceCategory> getAllRaceCategories() {
        return raceCategoryRepository.findAll();
    }

    public RaceCategory getRaceCategoryById(Integer id) {
        return raceCategoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race category does not exist."));
    }
}
