package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistrationAvailabilityService {

    private static final String INVITATION_PENDING = "PENDING";
    private static final List<String> ACTIVE_REGISTRATION_STATUSES = List.of(
            RegistrationStatus.PENDING,
            RegistrationStatus.APPROVED
    );
    private static final List<String> BLOCKING_TOURNAMENT_STATUSES = List.of(
            EventStatus.OPEN_FOR_REGISTRATION,
            EventStatus.REGISTRATION_CLOSED,
            EventStatus.ENTRIES_FINALIZED,
            EventStatus.READY,
            EventStatus.IN_PROGRESS,
            EventStatus.PENDING_REVIEW
    );

    private final RegistrationRepository registrationRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;

    public RegistrationAvailabilityService(
            RegistrationRepository registrationRepository,
            JockeyInvitationRepository jockeyInvitationRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
    }

    /**
     * Kiểm tra Owner, ngựa và Jockey có đang rảnh để tạo một lời mời mới hay không.
     * Hàm chỉ kiểm tra xung đột với Registration/Invitation đã tồn tại; hàm không
     * tạo lời mời và cũng không cập nhật dữ liệu trong database.
     *
     * Quy tắc đang áp dụng:
     * - mỗi Owner chỉ được có một Registration đang hoạt động hoặc một Invitation
     *   PENDING trong cùng Tournament;
     * - ngựa không được có Registration đang hoạt động hoặc Invitation PENDING
     *   tại bất kỳ Tournament nào chưa COMPLETED/CANCELLED;
     * - Jockey không được có Registration đang hoạt động hoặc Invitation PENDING
     *   tại bất kỳ Tournament nào chưa COMPLETED/CANCELLED.
     *
     * excludedInvitationId dùng khi cần kiểm tra lại một lời mời hiện có: lời mời
     * mang ID này sẽ được bỏ qua để không tự xung đột với chính nó. Khi tạo lời mời
     * mới, caller truyền null vì chưa có Invitation nào cần loại trừ.
     *
     * Các điều kiện như role/trạng thái của Owner và Jockey, quyền sở hữu ngựa,
     * giấy sức khỏe, TournamentCondition, thời hạn đăng ký và sức chứa Tournament
     * không thuộc trách nhiệm của hàm này; chúng được kiểm tra bởi service eligibility.
     */
    public void validateInvitationCanBeCreated(
            Integer ownerId,
            Integer horseId,
            Integer jockeyId,
            Tournament tournament,
            Integer excludedInvitationId
    ) {
        // Bước 1: Chặn nếu Owner đã có Registration đang hoạt động hoặc một lời
        // mời PENDING khác trong chính Tournament đang chọn.
        validateOwnerForInvitation(ownerId, tournament.getTournamentId(), excludedInvitationId);

        // Bước 2: Chặn nếu ngựa đã được đăng ký hoặc đang nằm trong lời mời PENDING
        // của một Tournament chưa kết thúc, không phụ thuộc Race đã hoàn thành hay chưa.
        // excludedRegistrationId truyền null vì luồng tạo Invitation chưa có
        // Registration hiện tại nào cần bỏ qua.
        validateHorseActiveTournamentAvailability(horseId, null, excludedInvitationId);

        // Bước 3: Kiểm tra tương tự cho Jockey. Jockey chỉ được dùng lại sau khi
        // Tournament cũ chuyển COMPLETED hoặc CANCELLED.
        validateJockeyActiveTournamentAvailability(jockeyId, null, excludedInvitationId);
    }

    public void validateAcceptedInvitationCanCreateRegistration(
            Integer ownerId,
            Integer horseId,
            Integer jockeyId,
            Tournament tournament,
            Integer excludedInvitationId
    ) {
        validateOwnerForInvitation(ownerId, tournament.getTournamentId(), excludedInvitationId);
        validateHorseSameTournament(horseId, tournament.getTournamentId(), null);
        validateHorseActiveTournamentAvailability(horseId, null, excludedInvitationId);
        validateJockeySameTournament(jockeyId, tournament.getTournamentId(), null);
        validateJockeyActiveTournamentAvailability(jockeyId, null, excludedInvitationId);
    }

    public void validateOwnerRegistrationCanBeCreated(
            Tournament tournament,
            Horse horse,
            User owner,
            User jockey
    ) {
        validateHorseSameTournamentForOwnerRegistration(horse.getHorseId(), tournament.getTournamentId());
        validateOwnerSameTournamentForOwnerRegistration(owner.getUserID(), tournament.getTournamentId());
        validateHorseRegistrationAvailabilityForOwnerRegistration(horse.getHorseId());
        validateJockeyRegistrationAvailabilityForOwnerRegistration(jockey.getUserID(), tournament);
    }

    public void validateRegistrationCanBeApproved(
            Registration registration,
            Tournament tournament
    ) {
        List<String> approvedStatuses = List.of(RegistrationStatus.APPROVED);
        Integer excludedRegistrationId = registration.getRegistrationId();

        long ownerSameTournamentCount =
                registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                        tournament.getTournamentId(),
                        registration.getOwnerId(),
                        approvedStatuses,
                        excludedRegistrationId);
        if (ownerSameTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Owner already has an approved registration in this tournament.");
        }

        if (registration.getJockeyId() != null) {
            long jockeySameTournamentCount =
                    registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                            tournament.getTournamentId(),
                            registration.getJockeyId(),
                            approvedStatuses,
                            excludedRegistrationId);
            if (jockeySameTournamentCount > 0) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Jockey already has an approved registration in this tournament.");
            }
        }

        long activeHorseTournamentCount =
                registrationRepository.countByActiveTournamentAndHorseIdAndStatusInExcludingRegistration(
                        registration.getHorseId(),
                        approvedStatuses,
                        BLOCKING_TOURNAMENT_STATUSES,
                        excludedRegistrationId);
        if (activeHorseTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse already has an approved registration in an unfinished tournament.");
        }

        if (registration.getJockeyId() == null) {
            return;
        }

        long activeJockeyTournamentCount =
                registrationRepository.countByActiveTournamentAndJockeyIdAndStatusInExcludingRegistration(
                        registration.getJockeyId(),
                        approvedStatuses,
                        BLOCKING_TOURNAMENT_STATUSES,
                        excludedRegistrationId);
        if (activeJockeyTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Jockey already has an approved registration in an unfinished tournament.");
        }

        long activeHorseJockeyTournamentCount =
                registrationRepository.countByActiveTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
                        registration.getHorseId(),
                        registration.getJockeyId(),
                        approvedStatuses,
                        BLOCKING_TOURNAMENT_STATUSES,
                        excludedRegistrationId);
        if (activeHorseJockeyTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse and jockey already have an approved registration in an unfinished tournament.");
        }
    }

    private void validateOwnerForInvitation(
            Integer ownerId,
            Integer tournamentId,
            Integer excludedInvitationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                tournamentId,
                ownerId,
                ACTIVE_REGISTRATION_STATUSES,
                null);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chủ ngựa đã có một đơn đăng ký đang hoạt động trong giải đấu này.");
        }

        if (jockeyInvitationRepository.existsPendingInvitationForTournamentAndOwner(
                tournamentId,
                ownerId,
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chủ ngựa đã có một lời mời đang chờ xử lý trong giải đấu này.");
        }
    }

    private void validateHorseSameTournament(
            Integer horseId,
            Integer tournamentId,
            Integer excludedRegistrationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                tournamentId,
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    private void validateJockeySameTournament(
            Integer jockeyId,
            Integer tournamentId,
            Integer excludedRegistrationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournamentId,
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    private void validateHorseActiveTournamentAvailability(
            Integer horseId,
            Integer excludedRegistrationId,
            Integer excludedInvitationId
    ) {
        long activeTournamentRegistrations = registrationRepository.countByActiveTournamentAndHorseIdAndStatusInExcludingRegistration(
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                BLOCKING_TOURNAMENT_STATUSES,
                excludedRegistrationId);
        if (activeTournamentRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đang có đơn đăng ký ở một giải đấu chưa kết thúc.");
        }
        if (jockeyInvitationRepository.existsPendingInvitationInActiveTournamentForHorse(
                horseId,
                INVITATION_PENDING,
                BLOCKING_TOURNAMENT_STATUSES,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đang có lời mời chờ xử lý ở một giải đấu chưa kết thúc.");
        }
    }

    private void validateJockeyActiveTournamentAvailability(
            Integer jockeyId,
            Integer excludedRegistrationId,
            Integer excludedInvitationId
    ) {
        long activeTournamentRegistrations = registrationRepository.countByActiveTournamentAndJockeyIdAndStatusInExcludingRegistration(
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                BLOCKING_TOURNAMENT_STATUSES,
                excludedRegistrationId);
        if (activeTournamentRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đang có đơn đăng ký ở một giải đấu chưa kết thúc.");
        }

        if (jockeyInvitationRepository.existsPendingInvitationInActiveTournamentForJockey(
                jockeyId,
                INVITATION_PENDING,
                BLOCKING_TOURNAMENT_STATUSES,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đang có lời mời chờ xử lý ở một giải đấu chưa kết thúc.");
        }
    }

    private void validateHorseSameTournamentForOwnerRegistration(
            Integer horseId,
            Integer tournamentId
    ) {
        long duplicateCount = registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                tournamentId,
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (duplicateCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse already has an active registration in this tournament.");
        }
    }

    private void validateOwnerSameTournamentForOwnerRegistration(
            Integer ownerId,
            Integer tournamentId
    ) {
        long duplicateCount = registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                tournamentId,
                ownerId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (duplicateCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Owner already has an active registration in this tournament.");
        }
    }

    private void validateHorseRegistrationAvailabilityForOwnerRegistration(Integer horseId) {
        long activeTournamentCount = registrationRepository.countByActiveTournamentAndHorseIdAndStatusInExcludingRegistration(
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                BLOCKING_TOURNAMENT_STATUSES,
                null);

        if (activeTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse already has an active registration in an unfinished tournament.");
        }
    }

    private void validateJockeyRegistrationAvailabilityForOwnerRegistration(
            Integer jockeyId,
            Tournament tournament
    ) {
        long sameTournamentCount = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournament.getTournamentId(),
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (sameTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Jockey already has an active registration in this tournament.");
        }

        long activeTournamentCount = registrationRepository.countByActiveTournamentAndJockeyIdAndStatusInExcludingRegistration(
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                BLOCKING_TOURNAMENT_STATUSES,
                null);

        if (activeTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Jockey already has an active registration in an unfinished tournament.");
        }
    }
}
