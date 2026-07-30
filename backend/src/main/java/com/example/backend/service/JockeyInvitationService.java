package com.example.backend.service;

import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class JockeyInvitationService {

    private final RegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;

    public JockeyInvitationService(
            RegistrationRepository registrationRepository,
            TournamentRepository tournamentRepository,
            HorseRepository horseRepository,
            UserRepository userRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.tournamentRepository = tournamentRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
    }

    public JockeyInvitationResponse toResponse(JockeyInvitation invitation) {
        Registration registration = invitation.getRegistrationId() != null
                ? registrationRepository.findById(invitation.getRegistrationId()).orElse(null)
                : null;
        Integer tournamentId = invitation.getTournamentId() != null
                ? invitation.getTournamentId()
                : registration != null ? registration.getTournamentId() : null;
        Integer horseId = invitation.getHorseId() != null
                ? invitation.getHorseId()
                : registration != null ? registration.getHorseId() : null;
        Tournament tournament = tournamentId != null
                ? tournamentRepository.findById(tournamentId).orElse(null)
                : null;
        Horse horse = horseId != null
                ? horseRepository.findById(horseId).orElse(null)
                : null;
        User owner = userRepository.findById(invitation.getOwnerId()).orElse(null);
        User jockey = userRepository.findById(invitation.getJockeyId()).orElse(null);

        return JockeyInvitationResponse.builder()
                .invitationId(invitation.getInvitationId())
                .registrationId(invitation.getRegistrationId())
                .registrationNo(registration != null ? registration.getRegistrationNo() : null)
                .tournamentId(tournamentId)
                .tournamentName(tournament != null ? tournament.getTournamentName() : null)
                .tournamentStatus(tournament != null ? tournament.getStatus() : null)
                .tournamentStartDate(tournament != null ? tournament.getStartDate() : null)
                .tournamentEndDate(tournament != null ? tournament.getEndDate() : null)
                .horseId(horseId)
                .horseName(horse != null ? horse.getHorseName() : null)
                .ownerId(invitation.getOwnerId())
                .ownerName(owner != null ? owner.getUsername() : null)
                .jockeyId(invitation.getJockeyId())
                .jockeyName(jockey != null ? jockey.getUsername() : null)
                .message(invitation.getMessage())
                .createdAt(invitation.getCreatedAt())
                .respondedAt(invitation.getRespondedAt())
                .expiredAt(invitation.getExpiredAt())
                .status(invitation.getStatus())
                .registrationStatus(registration != null ? registration.getStatus() : null)
                .paymentStatus(registration != null ? registration.getPaymentStatus() : null)
                .approvalStatus(registration != null ? registration.getApprovalStatus() : null)
                .rejectionReason(registration != null ? registration.getRejectionReason() : null)
                .build();
    }
}
