package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.backend.dto.request.CreateInvitationRequest;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;

@Service
public class JockeyInvitationService {
    @Autowired
    private JockeyInvitationRepository jockeyInvitationRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private JockeyProfileRepository jockeyProfileRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Owner sends invitation to jockey for a registration
     * BR-27: Owner can only send invitation when Registration is PENDING
     */
    public JockeyInvitationResponse sendInvitation(User owner, CreateInvitationRequest request) {
        // Get registration
        Registration registration = registrationRepository.findById(request.getRegistrationID())
                .orElseThrow(() -> new ApiException("Registration not found"));

        // BR-27: Check registration is PENDING and owned by this owner
        if (!registration.getStatus().equals("PENDING")) {
            throw new ApiException("Can only send invitation for PENDING registrations");
        }

        if (!registration.getOwner().getUserID().equals(owner.getUserID())) {
            throw new ApiException("You can only send invitations for your own horses");
        }

        // Get jockey user
        User jockey = userRepository.findById(request.getJockeyID())
                .orElseThrow(() -> new ApiException("Jockey not found"));

        // BR-04: Verify jockey has JOCKEY role and active profile
        if (!jockey.getRole().getRoleName().equals("JOCKEY")) {
            throw new ApiException("Selected user is not a jockey");
        }

        JockeyProfile jockeyProfile = jockeyProfileRepository.findById(request.getJockeyID())
                .orElseThrow(() -> new ApiException("Jockey profile not found"));

        if (!jockeyProfile.getStatus().equals("ACTIVE")) {
            throw new ApiException("Jockey is not active");
        }

        // Check if invitation already exists
        if (jockeyInvitationRepository.findByRegistration(registration).isPresent()) {
            throw new ApiException("Invitation already sent for this registration");
        }

        JockeyInvitation invitation = new JockeyInvitation();
        invitation.setRegistration(registration);
        invitation.setOwner(owner);
        invitation.setJockey(jockey);
        invitation.setStatus("PENDING");
        invitation.setSentAt(LocalDateTime.now());

        JockeyInvitation saved = jockeyInvitationRepository.save(invitation);
        return toResponse(saved);
    }

    /**
     * Jockey accepts an invitation
     * BR-29: ACCEPTED updates jockeyID and confirmedAt
     */
    public JockeyInvitationResponse acceptInvitation(User jockey, Integer invitationID) {
        JockeyInvitation invitation = jockeyInvitationRepository.findById(invitationID)
                .orElseThrow(() -> new ApiException("Invitation not found"));

        if (!invitation.getStatus().equals("PENDING")) {
            throw new ApiException("Invitation is not pending");
        }

        if (!invitation.getJockey().getUserID().equals(jockey.getUserID())) {
            throw new ApiException("This invitation is not assigned to you");
        }

        // Verify jockey profile exists and is active
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException("Jockey profile not found"));

        // Check BR-08: Jockey must be ACTIVE
        if (!profile.getStatus().equals("ACTIVE")) {
            throw new ApiException("Your profile is not active");
        }

        invitation.setJockey(jockey);
        invitation.setStatus("ACCEPTED");
        invitation.setRespondedAt(LocalDateTime.now());

        // BR-26: Update registration to APPROVED
        Registration registration = invitation.getRegistration();
        registration.setStatus("APPROVED");
        registration.setJockey(jockey);
        registration.setConfirmedAt(LocalDateTime.now());
        registrationRepository.save(registration);

        JockeyInvitation saved = jockeyInvitationRepository.save(invitation);
        return toResponse(saved);
    }

    /**
     * Jockey rejects an invitation
     */
    public JockeyInvitationResponse rejectInvitation(User jockey, Integer invitationID) {
        JockeyInvitation invitation = jockeyInvitationRepository.findById(invitationID)
                .orElseThrow(() -> new ApiException("Invitation not found"));

        if (!invitation.getStatus().equals("PENDING")) {
            throw new ApiException("Invitation is not pending");
        }

        if (!invitation.getJockey().getUserID().equals(jockey.getUserID())) {
            throw new ApiException("This invitation is not assigned to you");
        }

        invitation.setStatus("REJECTED");
        invitation.setRespondedAt(LocalDateTime.now());

        JockeyInvitation saved = jockeyInvitationRepository.save(invitation);
        return toResponse(saved);
    }

    /**
     * Get all pending invitations for a jockey
     */
    public List<JockeyInvitationResponse> getJockeyInvitations(User jockey) {
        List<JockeyInvitation> invitations = jockeyInvitationRepository
                .findByJockeyAndStatus(jockey, "PENDING");
        return invitations.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private JockeyInvitationResponse toResponse(JockeyInvitation invitation) {
        Registration registration = invitation.getRegistration();
        User owner = invitation.getOwner();
        User jockey = invitation.getJockey();

        return new JockeyInvitationResponse(
                invitation.getInvitationID(),
                registration.getRegID(),
                registration.getRace().getRaceId(),
                registration.getHorse().getName(),
                owner.getUserID(),
                owner.getFullName(),
                jockey != null ? jockey.getUserID() : null,
                jockey != null ? jockey.getFullName() : null,
                invitation.getStatus(),
                invitation.getSentAt(),
                invitation.getRespondedAt(),
                registration.getConfirmedAt()
        );
    }
}
