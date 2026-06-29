package com.example.backend.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Authenticates Unity's calls to /api/race-engine/** using a
 * per-launch race engine token header instead of a user JWT.
 *
 * Deliberately NOT a @Component: Spring Boot auto-registers any
 * Filter bean as a global servlet filter (url pattern "/*"), which
 * would affect every request in the app, not just race-engine calls.
 * This filter is constructed inside RaceEngineSecurityConfig and is
 * scoped only to the /api/race-engine/** SecurityFilterChain.
 */
public class RaceEngineTokenHeaderFilter extends OncePerRequestFilter {

    private static final String HEADER_NAME = "X-Race-Engine-Key";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String providedToken = request.getHeader(HEADER_NAME);

        if (providedToken == null || providedToken.isBlank()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"message\":\"Missing race engine launch token.\"}"
            );
            return;
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        "race-engine",
                        null,
                        Collections.emptyList()
                );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
