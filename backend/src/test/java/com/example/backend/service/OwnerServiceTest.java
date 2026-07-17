package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.backend.dto.request.InviteJockeyRequest;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.OwnerProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
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
    private OwnerProfileRepository ownerProfileRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TournamentRepository tournamentRepository;
    @Mock
    private FileUploadService fileUploadService;

    private OwnerServiceImpl ownerService;

    @BeforeEach
    void setUp() {
        ownerService = new OwnerServiceImpl(
                horseRepository,
                registrationRepository,
                jockeyInvitationRepository,
                jockeyProfileRepository,
                ownerProfileRepository,
                userRepository,
                tournamentRepository,
                fileUploadService,
                new RegistrationAvailabilityService(registrationRepository, jockeyInvitationRepository),
                new JockeyInvitationService(
                        registrationRepository,
                        tournamentRepository,
                        horseRepository,
                        userRepository));

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
                .age(4)
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

    private void mockTournamentSnapshot(LocalDateTime registrationDeadline) {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(1);
        tournament.setTournamentName("Summer Cup");
        tournament.setStartDate(registrationDeadline.toLocalDate().plusDays(1));
        tournament.setEndDate(registrationDeadline.toLocalDate().plusDays(2));
        tournament.setRegistrationCloseAt(registrationDeadline);
        tournament.setMaxRegistrations(null);
        tournament.setStatus("OPEN_FOR_REGISTRATION");
        when(tournamentRepository.findById(1)).thenReturn(Optional.of(tournament));
    }

    private User user(Integer userId, String email, String roleName) {
        Role role = new Role();
        role.setRoleName(roleName);

        User user = new User();
        user.setUserID(userId);
        user.setEmail(email);
        user.setUsername(roleName + " Name");
        user.setStatus("ACTIVE");
        user.setRole(role);
        return user;
    }
}
