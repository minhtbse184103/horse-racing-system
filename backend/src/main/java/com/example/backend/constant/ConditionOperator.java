package com.example.backend.constant;

import java.util.Set;

public final class ConditionOperator {

    public static final String EQ = "EQ";
    public static final String GT = "GT";
    public static final String GTE = "GTE";
    public static final String LT = "LT";
    public static final String LTE = "LTE";
    public static final String BETWEEN = "BETWEEN";

    public static final Set<String> NUMERIC_OPERATORS =
            Set.of(EQ, GT, GTE, LT, LTE, BETWEEN);

    public static final Set<String> GENDER_OPERATORS =
            Set.of(EQ);

    private ConditionOperator() {
    }
}