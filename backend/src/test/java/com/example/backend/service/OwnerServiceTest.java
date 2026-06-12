package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.backend.dto.request.InviteJockeyRequest;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class OwnerServiceTest {

    @Mock
    private HorseRepository horseRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private JockeyInvitationRepository jockeyInvitationRepository;
    @Mock
    private JockeyProfileRepository jockeyProfileRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;

    private OwnerServiceImpl ownerService;

    @BeforeEach
    void setUp() {
        ownerService = new OwnerServiceImpl(
                horseRepository,
                registrationRepository,
                jockeyInvitationRepository,
                jockeyProfileRepository,
                userRepository,
                jdbcTemplate);

        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("owner@example.com", null));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void inviteJockeyRejectsExpiryAtOrAfterTournamentRegistrationDeadline() throws Exception {
        LocalDateTime registrationDeadline = LocalDateTime.now().plusDays(2);
        InviteJockeyRequest request = inviteRequest(registrationDeadline);
        User owner = user(1, "owner@example.com", "OWNER");
        Horse horse = Horse.builder()
                .horseId(10)
                .ownerId(1)
                .horseName("Lightning")
                .weight(BigDecimal.valueOf(450))
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(horseRepository.findByHorseIdAndOwnerId(10, 1)).thenReturn(Optional.of(horse));
        mockTournamentSnapshot(registrationDeadline);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> ownerService.inviteJockey(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("Thời hạn lời mời phải trước hạn đăng ký của giải đấu.", exception.getMessage());
        verify(userRepository, never()).findById(20);
        verify(jockeyInvitationRepository, never()).save(any());
    }

    private InviteJockeyRequest inviteRequest(LocalDateTime expiredAt) {
        InviteJockeyRequest request = new InviteJockeyRequest();
        request.setTournamentId(1);
        request.setHorseId(10);
        request.setJockeyId(20);
        request.setExpiredAt(expiredAt);
        request.setMessage("Please join this tournament.");
        return request;
    }

    private void mockTournamentSnapshot(LocalDateTime registrationDeadline) throws Exception {
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(1)))
                .thenAnswer(invocation -> {
                    RowMapper<?> rowMapper = invocation.getArgument(1);
                    ResultSet resultSet = mock(ResultSet.class);
                    when(resultSet.getInt("tournamentID")).thenReturn(1);
                    when(resultSet.getString("tournamentName")).thenReturn("Summer Cup");
                    when(resultSet.getTimestamp("registrationDeadline"))
                            .thenReturn(Timestamp.valueOf(registrationDeadline));
                    when(resultSet.getObject("maxParticipants")).thenReturn(null);
                    when(resultSet.getString("status")).thenReturn("OpenForRegistration");
                    return rowMapper.mapRow(resultSet, 0);
                });
    }

    private User user(Integer userId, String email, String roleName) {
        Role role = new Role();
        role.setRoleName(roleName);

        User user = new User();
        user.setUserID(userId);
        user.setEmail(email);
        user.setFullName(roleName + " Name");
        user.setStatus("ACTIVE");
        user.setRole(role);
        return user;
    }
}
