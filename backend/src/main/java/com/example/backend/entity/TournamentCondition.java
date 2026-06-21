package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(
        name = "TournamentCondition",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "TournamentCondition_index_3",
                        columnNames = {"tournamentID", "conditionType"}
                )
        }
)
public class TournamentCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conditionID")
    private Integer conditionId;

    @Column(name = "tournamentID", nullable = false)
    private Integer tournamentId;

    @Column(name = "conditionType", nullable = false, length = 50)
    private String conditionType;

    @Column(name = "`operator`", nullable = false, length = 20)
    private String operator;

    @Column(name = "minValue", precision = 10, scale = 2)
    private BigDecimal minValue;

    @Column(name = "`maxValue`", precision = 10, scale = 2)
    private BigDecimal maxValue;

    @Column(name = "`value`", length = 50)
    private String value;
}
