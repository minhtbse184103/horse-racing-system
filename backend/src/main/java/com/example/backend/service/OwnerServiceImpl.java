package com.example.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.InviteJockeyRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.OwnerDashboardResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.OwnerProfile;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.OwnerProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;

@Service
public class OwnerServiceImpl implements OwnerService {
    private static final String ROLE_OWNER = "OWNER";
    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_PENDING = "PENDING";

    private static final String REGISTRATION_ACCEPTED = "ACCEPTED";
    private static final String REGISTRATION_CONFIRMED = "CONFIRMED";
    private static final String REGISTRATION_CANCELLED = "CANCELLED";
    private static final String REGISTRATION_REJECTED = "REJECTED";

    private static final String INVITATION_PENDING = "PENDING";
    private static final String INVITATION_CANCELLED = "CANCELLED";

    private static final String TOURNAMENT_OPEN_FOR_REGISTRATION = "OpenForRegistration";

    private final HorseRepository horseRepository;
    private final RegistrationRepository registrationRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;
    private final JockeyProfileRepository jockeyProfileRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public OwnerServiceImpl(
            HorseRepository horseRepository,
            RegistrationRepository registrationRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            JockeyProfileRepository jockeyProfileRepository,
            OwnerProfileRepository ownerProfileRepository,
            UserRepository userRepository,
            JdbcTemplate jdbcTemplate) {
        this.horseRepository = horseRepository;
        this.registrationRepository = registrationRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.ownerProfileRepository = ownerProfileRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    // Tính toán số liệu dashboard của owner gồm tổng ngựa, tổng registration và số ngựa đang tham gia.
    @Transactional(readOnly = true)
    @Override
    public OwnerDashboardResponse getDashboard() {
        User owner = getCurrentOwner();
        Integer ownerId = owner.getUserID();
        List<Horse> horses = horseRepository.findByOwnerId(ownerId);

        long participatedHorses = horses.stream()
                .filter(horse -> hasActiveRegistration(horse.getHorseId()))
                .count();

        return OwnerDashboardResponse.builder()
                .ownerId(ownerId)
                .ownerName(owner.getFullName())
                .totalHorses(horseRepository.countByOwnerId(ownerId))
                .totalRegistrations(registrationRepository.countByOwnerId(ownerId))
                .registeredHorses(registrationRepository.countRegisteredHorsesByOwnerId(ownerId))
                .participatedHorses(participatedHorses)
                .build();
    }

    // Lấy toàn bộ danh sách ngựa thuộc owner hiện tại và map sang DTO trả về.
    @Transactional(readOnly = true)
    @Override
    public List<HorseResponse> getMyHorses() {
        Integer ownerId = getCurrentOwnerProfile().getOwnerId();
        return horseRepository.findByOwnerId(ownerId)
                .stream()
                .map(this::mapHorseToResponse)
                .toList();
    }

    // Lấy chi tiết một ngựa sau khi kiểm tra ngựa đó thuộc owner hiện tại.
    @Transactional(readOnly = true)
    @Override
    public HorseResponse getMyHorseById(Integer horseId) {
        return mapHorseToResponse(getOwnedHorse(horseId));
    }

    // Tạo hồ sơ ngựa mới sau khi kiểm tra tên ngựa không trùng.
    @Transactional
    @Override
    public HorseResponse createHorse(CreateHorseRequest request) {
        Integer ownerId = getCurrentOwnerProfile().getOwnerId();
        String passportNumber = normalizeUppercase(request.getPassportNumber());
        String horseName = normalizeText(request.getHorseName());

        if (horseRepository.existsByPassportNumberIgnoreCase(passportNumber)) {
            throw new ApiException(HttpStatus.CONFLICT, "Passport Number da ton tai.");
        }

        if (horseRepository.existsByHorseNameIgnoreCase(horseName)) {
            throw new ApiException(HttpStatus.CONFLICT, "Tên ngựa đã tồn tại.");
        }

        Horse horse = Horse.builder()
                .ownerId(ownerId)
                .passportNumber(passportNumber)
                .horseName(horseName)
                .breed(normalizeText(request.getBreed()))
                .gender(normalizeUppercase(request.getGender()))
                .color(normalizeText(request.getColor()))
                .dayOfBirth(request.getDayOfBirth())
                .weight(request.getWeight())
                .healthCertExpiry(request.getHealthCertExpiry())
                .horsePassportUrl(normalizeText(request.getHorsePassportUrl()))
                .healthCertificateUrl(normalizeText(request.getHealthCertificateUrl()))
                .horseImageUrl(normalizeText(request.getHorseImageUrl()))
                .status(STATUS_PENDING)
                .rejectionReason(null)
                .build();

        return mapHorseToResponse(horseRepository.save(horse));
    }

    // Cập nhật thông tin ngựa, chỉ cho phép owner sửa ngựa thuộc về chính mình.
    @Transactional
    @Override
    public HorseResponse updateHorse(Integer horseId, UpdateHorseRequest request) {
        Horse horse = getOwnedHorse(horseId);
        String passportNumber = normalizeUppercase(request.getPassportNumber());
        String horseName = normalizeText(request.getHorseName());

        if (horseRepository.existsByPassportNumberIgnoreCaseAndHorseIdNot(passportNumber, horse.getHorseId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Passport Number da ton tai.");
        }

        if (horseRepository.existsByHorseNameIgnoreCaseAndHorseIdNot(horseName, horse.getHorseId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Tên ngựa đã tồn tại.");
        }

        horse.setPassportNumber(passportNumber);
        horse.setHorseName(horseName);
        horse.setBreed(normalizeText(request.getBreed()));
        horse.setGender(normalizeUppercase(request.getGender()));
        horse.setColor(normalizeText(request.getColor()));
        horse.setDayOfBirth(request.getDayOfBirth());
        horse.setWeight(request.getWeight());
        horse.setHealthCertExpiry(request.getHealthCertExpiry());
        horse.setHorsePassportUrl(normalizeText(request.getHorsePassportUrl()));
        horse.setHealthCertificateUrl(normalizeText(request.getHealthCertificateUrl()));
        horse.setHorseImageUrl(normalizeText(request.getHorseImageUrl()));
        horse.setStatus(STATUS_PENDING);
        horse.setRejectionReason(null);

        return mapHorseToResponse(horseRepository.save(horse));
    }

    // Xóa ngựa nếu ngựa chưa có invitation và registration liên quan.
    @Transactional
    @Override
    public void deleteHorse(Integer horseId) {
        Horse horse = getOwnedHorse(horseId);

        if (jockeyInvitationRepository.existsByHorseId(horse.getHorseId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa đã có lời mời nài ngựa nên không thể xóa.");
        }

        if (registrationRepository.existsByHorseId(horse.getHorseId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa đã có đơn đăng ký giải đấu nên không thể xóa.");
        }

        horseRepository.delete(horse);
    }

    // Lấy danh sách lời mời jockey mà owner hiện tại đã gửi, mới nhất lên trước.
    @Transactional(readOnly = true)
    @Override
    public List<JockeyInvitationResponse> getMyInvitations() {
        Integer ownerId = getCurrentOwnerProfile().getOwnerId();
        return jockeyInvitationRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(this::mapInvitationToResponse)
                .toList();
    }

    // Owner mời jockey tham gia tournament cùng một ngựa, chỉ tạo invitation PENDING.
    @Transactional
    @Override
    public JockeyInvitationResponse inviteJockey(InviteJockeyRequest request) {
        User owner = getCurrentOwner();
        Horse horse = getOwnedHorse(request.getHorseId());
        TournamentSnapshot tournament = getTournamentSnapshot(request.getTournamentId());

        validateHorseCanRegister(horse, tournament);
        validateInvitationExpiry(request.getExpiredAt(), tournament);
        validateOwnerCanRegisterForTournament(owner.getUserID(), tournament.tournamentId(), null);
        validateHorseActiveRegistrationForTournament(horse.getHorseId(), tournament.tournamentId(), null);

        User jockey = getJockey(request.getJockeyId());
        validateJockeyAvailableForTournament(tournament, jockey.getUserID(), null, null);
        validateHorseJockeyPairAvailableForOverlappingTournament(
                horse.getHorseId(),
                jockey.getUserID(),
                tournament,
                null,
                null);

        Registration registration = registrationRepository.findByTournamentIdAndHorseId(
                        request.getTournamentId(), request.getHorseId()).orElse(null);
        if (registration != null
                && !List.of(REGISTRATION_CANCELLED, REGISTRATION_REJECTED).contains(registration.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }

        if (jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndJockeyIdAndStatus(
                tournament.tournamentId(), horse.getHorseId(), jockey.getUserID(), INVITATION_PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT, "Đã tồn tại lời mời đang chờ xử lý cho nài ngựa này.");
        }

        JockeyInvitation invitation = JockeyInvitation.builder()
                .tournamentId(tournament.tournamentId())
                .horseId(horse.getHorseId())
                .ownerId(owner.getUserID())
                .jockeyId(jockey.getUserID())
                .expiredAt(request.getExpiredAt())
                .message(request.getMessage())
                .status(INVITATION_PENDING)
                .build();

        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    // Kiểm tra owner chưa có registration active hoặc lời mời pending trong cùng tournament.
    private void validateOwnerCanRegisterForTournament(
            Integer ownerId,
            Integer tournamentId,
            Integer excludedInvitationId) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                tournamentId,
                ownerId,
                List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED),
                null);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chủ ngựa đã có một đơn đăng ký đang hoạt động trong giải đấu này.");
        }

        if (jockeyInvitationRepository.existsPendingInvitationForTournamentAndOwner(
                tournamentId, ownerId, INVITATION_PENDING, excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chủ ngựa đã có một lời mời đang chờ xử lý trong giải đấu này.");
        }
    }

    // Kiểm tra ngựa chưa có registration active trong cùng tournament.
    private void validateHorseActiveRegistrationForTournament(
            Integer horseId,
            Integer tournamentId,
            Integer excludedRegistrationId) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                tournamentId,
                horseId,
                List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED),
                excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    // Kiểm tra jockey chưa có registration active hoặc lời mời pending trong tournament bị overlap.
    private void validateJockeyAvailableForTournament(
            TournamentSnapshot tournament,
            Integer jockeyId,
            Integer excludedRegistrationId,
            Integer excludedInvitationId) {
        long sameTournamentRegistrations = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournament.tournamentId(),
                jockeyId,
                List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED),
                excludedRegistrationId);
        if (sameTournamentRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }

        long overlappingRegistrations = registrationRepository
                .countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
                        jockeyId,
                        tournament.startDate(),
                        tournament.endDate(),
                        List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED),
                        excludedRegistrationId);
        if (overlappingRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có đơn đăng ký ở giải đấu trùng thời gian.");
        }

        if (jockeyInvitationRepository.existsPendingOverlappingInvitationForJockey(
                jockeyId,
                tournament.startDate(),
                tournament.endDate(),
                INVITATION_PENDING,
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có lời mời đang chờ xử lý ở giải đấu trùng thời gian.");
        }
    }

    // Kiểm tra cặp horse + jockey chưa được dùng ở tournament khác bị overlap.
    private void validateHorseJockeyPairAvailableForOverlappingTournament(
            Integer horseId,
            Integer jockeyId,
            TournamentSnapshot tournament,
            Integer excludedRegistrationId,
            Integer excludedInvitationId) {
        long overlappingRegistrations = registrationRepository
                .countByOverlappingTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
                        horseId,
                        jockeyId,
                        tournament.startDate(),
                        tournament.endDate(),
                        List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED),
                        excludedRegistrationId);
        if (overlappingRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cặp ngựa và nài ngựa này đã được đăng ký ở giải đấu trùng thời gian.");
        }

        if (jockeyInvitationRepository.existsPendingOverlappingInvitationForHorseAndJockey(
                horseId,
                jockeyId,
                tournament.startDate(),
                tournament.endDate(),
                INVITATION_PENDING,
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cặp ngựa và nài ngựa này đã có lời mời ở giải đấu trùng thời gian.");
        }
    }

    // Owner hủy lời mời đang PENDING và chuyển registration liên quan sang CANCELLED.
    @Transactional
    @Override
    public JockeyInvitationResponse cancelInvitation(Integer invitationId) {
        User owner = getCurrentOwner();
        JockeyInvitation invitation = jockeyInvitationRepository
                .findByInvitationIdAndOwnerId(invitationId, owner.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lời mời không tồn tại."));

        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể hủy lời mời đang ở trạng thái PENDING.");
        }

        Registration registration = invitation.getRegistrationId() != null
                ? registrationRepository.findById(invitation.getRegistrationId()).orElse(null)
                : null;

        invitation.setStatus(INVITATION_CANCELLED);
        invitation.setRespondedAt(LocalDateTime.now());

        if (registration != null) {
            registration.setStatus(REGISTRATION_CANCELLED);
            registration.setJockeyId(null);
            registrationRepository.save(registration);
        }

        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    // Lấy user owner từ JWT hiện tại và kiểm tra đúng role OWNER.
    private User getCurrentOwner() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Người dùng chưa được xác thực.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Chủ ngựa không tồn tại."));

        if (user.getRole() == null || !ROLE_OWNER.equals(user.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ chủ ngựa mới có thể truy cập tài nguyên này.");
        }

        return user;
    }

    // Lấy ngựa theo horseId và đảm bảo ngựa đó thuộc owner đang đăng nhập.
    private OwnerProfile getCurrentOwnerProfile() {
        User owner = getCurrentOwner();
        return ownerProfileRepository.findById(owner.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN,
                        "Owner profile chua duoc admin xac minh."));
    }

    private Horse getOwnedHorse(Integer horseId) {
        Integer ownerId = getCurrentOwner().getUserID();
        return horseRepository.findByHorseIdAndOwnerId(horseId, ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));
    }

    // Lấy user jockey được mời và kiểm tra user đó có role JOCKEY cùng profile hợp lệ.
    private User getJockey(Integer jockeyId) {
        User jockey = userRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nài ngựa không tồn tại."));

        if (jockey.getRole() == null || !ROLE_JOCKEY.equals(jockey.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Người dùng được chọn không phải là nài ngựa.");
        }

        if (!STATUS_ACTIVE.equals(jockey.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản nài ngựa được chọn không hoạt động.");
        }

        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Hồ sơ nài ngựa không tồn tại."));

        if (!STATUS_ACTIVE.equals(profile.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Hồ sơ nài ngựa được chọn không hoạt động.");
        }

        return jockey;
    }

    // Kiểm tra ngựa đủ điều kiện đăng ký tournament trước khi owner gửi lời mời.
    private void validateHorseCanRegister(Horse horse, TournamentSnapshot tournament) {
        if (!STATUS_ACTIVE.equals(horse.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ ngựa đang hoạt động mới có thể đăng ký.");
        }

        if (!TOURNAMENT_OPEN_FOR_REGISTRATION.equals(tournament.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chỉ giải đấu đang mở đăng ký mới có thể nhận đơn đăng ký từ chủ ngựa.");
        }

        if (tournament.registrationDeadline() != null
                && tournament.registrationDeadline().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Hạn đăng ký giải đấu đã qua.");
        }

        if (tournament.maxParticipants() != null) {
            long activeRegistrations = registrationRepository.countByTournamentIdAndStatusIn(
                    tournament.tournamentId(),
                    List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED));
            if (activeRegistrations >= tournament.maxParticipants()) {
                throw new ApiException(HttpStatus.CONFLICT, "Giải đấu đã đạt số người tham gia tối đa.");
            }
        }
    }

    // Đảm bảo hạn phản hồi lời mời jockey không vượt quá hạn đăng ký tournament.
    private void validateInvitationExpiry(LocalDateTime expiredAt, TournamentSnapshot tournament) {
        if (expiredAt == null || tournament.registrationDeadline() == null) {
            return;
        }

        if (!expiredAt.isBefore(tournament.registrationDeadline())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Thời hạn lời mời phải trước hạn đăng ký của giải đấu.");
        }
    }

    // Chuyển entity Horse sang HorseResponse và bổ sung thông tin registration của ngựa.
    private HorseResponse mapHorseToResponse(Horse horse) {
        List<Integer> registrationIds = registrationRepository.findRegistrationIdsByHorseId(horse.getHorseId());
        return HorseResponse.builder()
                .horseId(horse.getHorseId())
                .ownerId(horse.getOwnerId())
                .passportNumber(horse.getPassportNumber())
                .horseName(horse.getHorseName())
                .breed(horse.getBreed())
                .gender(horse.getGender())
                .color(horse.getColor())
                .dayOfBirth(horse.getDayOfBirth())
                .weight(horse.getWeight())
                .healthCertExpiry(horse.getHealthCertExpiry())
                .horsePassportUrl(horse.getHorsePassportUrl())
                .healthCertificateUrl(horse.getHealthCertificateUrl())
                .horseImageUrl(horse.getHorseImageUrl())
                .status(horse.getStatus())
                .rejectionReason(horse.getRejectionReason())
                .registrationCount(registrationIds.size())
                .participated(hasActiveRegistration(registrationIds))
                .build();
    }

    // Kiểm tra một ngựa có registration active hay không dựa trên horseId.
    private boolean hasActiveRegistration(Integer horseId) {
        return hasActiveRegistration(registrationRepository.findRegistrationIdsByHorseId(horseId));
    }

    // Kiểm tra danh sách registration có trạng thái active như ACCEPTED hoặc CONFIRMED.
    private boolean hasActiveRegistration(Collection<Integer> registrationIds) {
        return !registrationIds.isEmpty()
                && registrationRepository.countByRegistrationIdInAndStatusIn(
                registrationIds,
                List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED)) > 0;
    }

    // Chuyển entity invitation sang DTO, kèm thông tin tournament, horse, owner và jockey.
    private JockeyInvitationResponse mapInvitationToResponse(JockeyInvitation invitation) {
        Registration registration = invitation.getRegistrationId() != null
                ? registrationRepository.findById(invitation.getRegistrationId()).orElse(null)
                : null;
        Integer tournamentId = invitation.getTournamentId() != null
                ? invitation.getTournamentId()
                : registration != null ? registration.getTournamentId() : null;
        Integer horseId = invitation.getHorseId() != null
                ? invitation.getHorseId()
                : registration != null ? registration.getHorseId() : null;
        TournamentSnapshot tournament = tournamentId != null
                ? getTournamentSnapshotOrNull(tournamentId)
                : null;
        Horse horse = horseId != null
                ? horseRepository.findById(horseId).orElse(null)
                : null;
        User owner = userRepository.findById(invitation.getOwnerId()).orElse(null);
        User jockey = userRepository.findById(invitation.getJockeyId()).orElse(null);

        return JockeyInvitationResponse.builder()
                .invitationId(invitation.getInvitationId())
                .registrationId(invitation.getRegistrationId())
                .tournamentId(tournamentId)
                .tournamentName(tournament != null ? tournament.tournamentName() : null)
                .tournamentStartDate(tournament != null ? tournament.startDate() : null)
                .tournamentEndDate(tournament != null ? tournament.endDate() : null)
                .horseId(horseId)
                .horseName(horse != null ? horse.getHorseName() : null)
                .ownerId(invitation.getOwnerId())
                .ownerName(owner != null ? owner.getFullName() : null)
                .jockeyId(invitation.getJockeyId())
                .jockeyName(jockey != null ? jockey.getFullName() : null)
                .message(invitation.getMessage())
                .createdAt(invitation.getCreatedAt())
                .respondedAt(invitation.getRespondedAt())
                .expiredAt(invitation.getExpiredAt())
                .status(invitation.getStatus())
                .registrationStatus(registration != null ? registration.getStatus() : null)
                .build();
    }

    // Lấy snapshot tournament bắt buộc phải tồn tại để phục vụ nghiệp vụ gửi lời mời.
    private TournamentSnapshot getTournamentSnapshot(Integer tournamentId) {
        TournamentSnapshot tournament = getTournamentSnapshotOrNull(tournamentId);
        if (tournament == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại.");
        }
        return tournament;
    }

    // Lấy thông tin rút gọn của tournament bằng query trực tiếp; trả null nếu không tìm thấy.
    private TournamentSnapshot getTournamentSnapshotOrNull(Integer tournamentId) {
        try {
            return jdbcTemplate.queryForObject("""
                    SELECT tournamentID, tournamentName, startDate, endDate, registrationDeadline, maxParticipants, status
                    FROM Tournament
                    WHERE tournamentID = ?
                    """,
                    (rs, rowNum) -> new TournamentSnapshot(
                            rs.getInt("tournamentID"),
                            rs.getString("tournamentName"),
                            rs.getDate("startDate") != null
                                    ? rs.getDate("startDate").toLocalDate()
                                    : null,
                            rs.getDate("endDate") != null
                                    ? rs.getDate("endDate").toLocalDate()
                                    : null,
                            rs.getTimestamp("registrationDeadline") != null
                                    ? rs.getTimestamp("registrationDeadline").toLocalDateTime()
                                    : null,
                            (Integer) rs.getObject("maxParticipants"),
                            rs.getString("status")),
                    tournamentId);
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    private record TournamentSnapshot(
            Integer tournamentId,
            String tournamentName,
            LocalDate startDate,
            LocalDate endDate,
            LocalDateTime registrationDeadline,
            Integer maxParticipants,
            String status) {
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeUppercase(String value) {
        String normalizedValue = normalizeText(value);
        return normalizedValue == null ? null : normalizedValue.toUpperCase(Locale.ROOT);
    }
}
