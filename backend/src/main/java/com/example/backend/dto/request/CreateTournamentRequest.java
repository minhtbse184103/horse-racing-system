package com.example.backend.dto.request;

import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;

public class CreateTournamentRequest {
    
    @NotBlank(message = "Tên giải đấu là bắt buộc")
    private String tournamentName;
    @NotBlank(message = "Địa điểm là bắt buộc")
    private String location;
    @NotNull(message = "Ngày bắt đầu là bắt buộc")
    @Future(message = "Ngày bắt đầu phải sau ngày hôm nay")
    private LocalDate startDate;
    @NotNull(message = "Ngày kết thúc là bắt buộc")
    private LocalDate endDate;
    @NotNull(message = "Hạn đăng ký là bắt buộc")
    private LocalDate registrationDeadline;
    @NotNull(message = "Số người tham gia tối thiểu là bắt buộc")
    @Min(value = 3, message = "Số người tham gia tối thiểu phải lớn hơn 2")
    private Integer minParticipants;

    @NotNull(message = "Số người tham gia tối đa là bắt buộc")
    @Positive(message = "Số người tham gia tối đa phải lớn hơn 0")
    private Integer maxParticipants;

    @NotNull(message = "Điều kiện giải đấu là bắt buộc")
    private Integer conditionId;
    
    public String getTournamentName() {
        return tournamentName;
    }

    public String getLocation() {
        return location;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public LocalDate getRegistrationDeadline() {
        return registrationDeadline;
    }
    public Integer getMinParticipants() {
        return minParticipants;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public Integer getConditionId() {
        return conditionId;
    }

}
