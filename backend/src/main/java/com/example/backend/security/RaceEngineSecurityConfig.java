package com.example.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Separate, narrowly-scoped security chain for Unity's race-engine
 * callbacks. Matched only on /api/race-engine/**, ordered before the
 * main SecurityConfig chain. RaceEngineTokenHeaderFilter requires the token
 * header to exist; race-specific token validation happens in the
 * race-engine services after the Race row is loaded.
 */
@Configuration
public class RaceEngineSecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain raceEngineSecurityFilterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource
    ) throws Exception {
        http.securityMatcher("/api/race-engine/**")
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(
                        new RaceEngineTokenHeaderFilter(),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
