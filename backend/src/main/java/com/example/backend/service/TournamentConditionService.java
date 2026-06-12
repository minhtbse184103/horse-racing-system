package com.example.backend.service;

import com.example.backend.entity.TournamentCondition;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.TournamentConditionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TournamentConditionService {
    private final TournamentConditionRepository repository;

    public TournamentConditionService(TournamentConditionRepository repository) {
        this.repository = repository;
    }

    public List<TournamentCondition> getAllConditions() {
        return repository.findAll();
    }

    public TournamentCondition getConditionById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Điều kiện giải đấu không tồn tại."
                ));
    }
}
