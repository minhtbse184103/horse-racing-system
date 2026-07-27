package com.example.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.InviteJockeyRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.FileUploadResponse;
import com.example.backend.dto.response.HorsePerformanceResponse;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.OwnerDashboardResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.HorsePerformanceSummary;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.OwnerProfile;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.HorsePerformanceSummaryRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.OwnerProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;

@Service
public class OwnerServiceImpl implements OwnerService {
    private static final String ROLE_OWNER = "OWNER";
    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_PENDING = "PENDING";

    private static final String REGISTRATION_CANCELLED = "CANCELLED";
    private static final List<String> ACTIVE_REGISTRATION_STATUSES = List.of(
            RegistrationStatus.PENDING,
            RegistrationStatus.APPROVED
    );

    private static final String INVITATION_PENDING = "PENDING";
    private static final String INVITATION_CANCELLED = "CANCELLED";

    private static final String TOURNAMENT_OPEN_FOR_REGISTRATION = "OPEN_FOR_REGISTRATION";

    private final HorseRepository horseRepository;
    private final HorsePerformanceSummaryRepository horsePerformanceSummaryRepository;
    private final RegistrationRepository registrationRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;
    private final JockeyProfileRepository jockeyProfileRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final UserRepository userRepository;
    private final TournamentRepository tournamentRepository;
    private final FileUploadService fileUploadService;
    private final RegistrationAvailabilityService availabilityService;
    private final RegistrationEligibilityService eligibilityService;
    private final JockeyInvitationService jockeyInvitationService;

    public OwnerServiceImpl(
            HorseRepository horseRepository,
            HorsePerformanceSummaryRepository horsePerformanceSummaryRepository,
            RegistrationRepository registrationRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            JockeyProfileRepository jockeyProfileRepository,
            OwnerProfileRepository ownerProfileRepository,
            UserRepository userRepository,
            TournamentRepository tournamentRepository,
            FileUploadService fileUploadService,
            RegistrationAvailabilityService availabilityService,
            RegistrationEligibilityService eligibilityService,
            JockeyInvitationService jockeyInvitationService) {
        this.horseRepository = horseRepository;
        this.horsePerformanceSummaryRepository = horsePerformanceSummaryRepository;
        this.registrationRepository = registrationRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.ownerProfileRepository = ownerProfileRepository;
        this.userRepository = userRepository;
        this.tournamentRepository = tournamentRepository;
        this.fileUploadService = fileUploadService;
        this.availabilityService = availabilityService;
        this.eligibilityService = eligibilityService;
        this.jockeyInvitationService = jockeyInvitationService;
    }

    // Tính toán số liệu dashboard của owner gồm tổng ngựa, tổng registration và số ngựa đang tham gia.
    @Transactional(readOnly = true)
    @Override
    public OwnerDashboardResponse getDashboard() {
        // Xác định owner hiện tại từ JWT trước khi gom số liệu dashboard.
        User owner = getCurrentOwner();
        Integer ownerId = owner.getUserID();
        // Lấy danh sách ngựa của owner để tính số ngựa đang có registration active.
        List<Horse> horses = horseRepository.findByOwnerId(ownerId);

        long participatedHorses = horses.stream()
                .filter(horse -> hasActiveRegistration(horse.getHorseId()))
                .count();

        // Query các chỉ số tổng hợp từ DB rồi trả về dashboard response.
        return OwnerDashboardResponse.builder()
                .ownerId(ownerId)
                .ownerName(owner.getUsername())
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
        // Owner phải có profile đã được duyệt mới được xem danh sách ngựa.
        Integer ownerId = getCurrentOwnerProfile().getOwnerId();
        // Query toàn bộ ngựa thuộc owner hiện tại và map sang response.
        return horseRepository.findByOwnerId(ownerId)
                .stream()
                .map(this::mapHorseToResponse)
                .toList();
    }

    // Lấy chi tiết một ngựa sau khi kiểm tra ngựa đó thuộc owner hiện tại.
    @Transactional(readOnly = true)
    @Override
    public HorseResponse getMyHorseById(Integer horseId) {
        // getOwnedHorse đã validate ngựa thuộc owner đang đăng nhập.
        return mapHorseToResponse(getOwnedHorse(horseId));
    }

    // Tạo hồ sơ ngựa mới sau khi kiểm tra tên ngựa không trùng.
    @Transactional
    @Override
    public HorseResponse createHorse(CreateHorseRequest request) {
        // Chỉ owner đã có profile được duyệt mới được tạo hồ sơ ngựa.
        Integer ownerId = getCurrentOwnerProfile().getOwnerId();
        String horseName = normalizeText(request.getHorseName());

        // Tên ngựa là duy nhất trong hệ thống, không cho tạo trùng.
        if (horseRepository.existsByHorseNameIgnoreCase(horseName)) {
            throw new ApiException(HttpStatus.CONFLICT, "Tên ngựa đã tồn tại.");
        }

        // Upload giấy chứng nhận sức khỏe và lưu URL vào hồ sơ ngựa.
        String healthCertificateUrl = storeHealthCertificate(request.getHealthCertificateFile());

        // Tạo ngựa mới ở trạng thái PENDING để admin duyệt.
        Horse horse = Horse.builder()
                .ownerId(ownerId)
                .horseName(horseName)
                .age(calculateAge(request.getDayOfBirth()))
                .dayOfBirth(request.getDayOfBirth())
                .weight(request.getWeight())
                .colour(normalizeText(request.getColour()))
                .sex(normalizeText(request.getSex()))
                .breeding(normalizeText(request.getBreeding()))
                .trainer(normalizeText(request.getTrainer()))
                .healthCertExpiry(request.getHealthCertExpiry())
                .healthCertificateUrl(healthCertificateUrl)
                .officialHorseProfileUrl(normalizeText(request.getOfficialHorseProfileUrl()))
                .status(STATUS_PENDING)
                .rejectionReason(null)
                .build();

        // Lưu hồ sơ ngựa xuống DB.
        return mapHorseToResponse(horseRepository.save(horse));
    }

    // Cập nhật thông tin ngựa, chỉ cho phép owner sửa ngựa thuộc về chính mình.
    @Transactional
    @Override
    public HorseResponse updateHorse(Integer horseId, UpdateHorseRequest request) {
        // Chỉ cho owner cập nhật ngựa thuộc sở hữu của chính mình.
        Horse horse = getOwnedHorse(horseId);
        String horseName = normalizeText(request.getHorseName());

        // Nếu đổi tên, tên mới không được trùng với ngựa khác.
        if (horseRepository.existsByHorseNameIgnoreCaseAndHorseIdNot(horseName, horse.getHorseId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Tên ngựa đã tồn tại.");
        }

        // Cập nhật thông tin ngựa và đưa về PENDING để admin duyệt lại.
        horse.setHorseName(horseName);
        horse.setAge(calculateAge(request.getDayOfBirth()));
        horse.setDayOfBirth(request.getDayOfBirth());
        horse.setWeight(request.getWeight());
        horse.setColour(normalizeText(request.getColour()));
        horse.setSex(normalizeText(request.getSex()));
        horse.setBreeding(normalizeText(request.getBreeding()));
        horse.setTrainer(normalizeText(request.getTrainer()));
        horse.setHealthCertExpiry(request.getHealthCertExpiry());
        horse.setOfficialHorseProfileUrl(normalizeText(request.getOfficialHorseProfileUrl()));
        horse.setStatus(STATUS_PENDING);
        horse.setRejectionReason(null);

        // Lưu thay đổi ngựa xuống DB.
        return mapHorseToResponse(horseRepository.save(horse));
    }

    // Xóa ngựa nếu ngựa chưa có invitation và registration liên quan.
    @Transactional
    @Override
    public void deleteHorse(Integer horseId) {
        // Chỉ owner sở hữu ngựa mới được xóa.
        Horse horse = getOwnedHorse(horseId);

        // Không cho xóa nếu ngựa đã có lời mời jockey liên quan.
        if (jockeyInvitationRepository.existsByHorseId(horse.getHorseId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa đã có lời mời nài ngựa nên không thể xóa.");
        }

        // Không cho xóa nếu ngựa đã có registration tham gia giải.
        if (registrationRepository.existsByHorseId(horse.getHorseId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa đã có đơn đăng ký giải đấu nên không thể xóa.");
        }

        // Xóa hồ sơ ngựa khỏi DB.
        horseRepository.delete(horse);
    }

    // Lấy danh sách lời mời jockey mà owner hiện tại đã gửi, mới nhất lên trước.
    @Transactional(readOnly = true)
    @Override
    public List<JockeyInvitationResponse> getMyInvitations() {
        // Lấy owner profile đã được duyệt rồi query các lời mời owner đã gửi.
        Integer ownerId = getCurrentOwnerProfile().getOwnerId();
        return jockeyInvitationRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(jockeyInvitationService::toResponse)
                .toList();
    }

    // Owner mời jockey tham gia tournament cùng một ngựa, chỉ tạo invitation PENDING.
    @Transactional
    @Override
    public JockeyInvitationResponse inviteJockey(InviteJockeyRequest request) {
        // Lấy owner, ngựa và tournament từ DB để kiểm tra quyền/điều kiện trước khi mời.
        User owner = getCurrentOwner();
        Horse horse = getOwnedHorse(request.getHorseId());
        Tournament tournament = getTournament(request.getTournamentId());

        // Ngựa phải hợp lệ để đăng ký và hạn lời mời không được vượt hạn đăng ký.
        validateHorseCanRegister(horse, tournament);
        validateInvitationExpiry(request.getExpiredAt(), tournament);

        // Lấy jockey được mời và kiểm tra điều kiện tham gia giải.
        User jockey = getJockey(request.getJockeyId());
        eligibilityService.validateParticipationRequirements(
                tournament,
                horse.getHorseId(),
                owner.getUserID(),
                jockey.getUserID()
        );
        availabilityService.validateInvitationCanBeCreated(
                owner.getUserID(),
                horse.getHorseId(),
                jockey.getUserID(),
                tournament,
                null);

        // Tạo lời mời PENDING để jockey phản hồi accept/reject.
        JockeyInvitation invitation = JockeyInvitation.builder()
                .tournamentId(tournament.getTournamentId())
                .horseId(horse.getHorseId())
                .ownerId(owner.getUserID())
                .jockeyId(jockey.getUserID())
                .expiredAt(request.getExpiredAt())
                .message(request.getMessage())
                .status(INVITATION_PENDING)
                .build();

        return jockeyInvitationService.toResponse(jockeyInvitationRepository.save(invitation));
    }

    // Owner hủy lời mời đang PENDING và chuyển registration liên quan sang CANCELLED.
    @Transactional
    @Override
    public JockeyInvitationResponse cancelInvitation(Integer invitationId) {
        // Owner chỉ được hủy lời mời do chính mình gửi.
        User owner = getCurrentOwner();
        JockeyInvitation invitation = jockeyInvitationRepository
                .findByInvitationIdAndOwnerId(invitationId, owner.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lời mời không tồn tại."));

        // Chỉ lời mời PENDING mới có thể hủy.
        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể hủy lời mời đang ở trạng thái PENDING.");
        }

        // Cập nhật lời mời sang CANCELLED.
        invitation.setStatus(INVITATION_CANCELLED);
        invitation.setRespondedAt(LocalDateTime.now());

        // Nếu lời mời đã sinh registration thì hủy registration liên quan.
        if (invitation.getRegistrationId() != null) {
            registrationRepository.findById(invitation.getRegistrationId())
                    .ifPresent(registration -> {
                        registration.setStatus(REGISTRATION_CANCELLED);
                        registration.setReviewedAt(LocalDateTime.now());
                        registrationRepository.save(registration);
                    });
        }

        return jockeyInvitationService.toResponse(jockeyInvitationRepository.save(invitation));
    }

    // Lấy user owner từ JWT hiện tại và kiểm tra đúng role OWNER.
    private User getCurrentOwner() {
        // Lấy owner đang đăng nhập từ JWT và validate role OWNER.
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
        // Owner phải có profile đã được admin xác minh mới dùng được chức năng owner.
        User owner = getCurrentOwner();
        return ownerProfileRepository.findById(owner.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN,
                        "Owner profile chua duoc admin xac minh."));
    }

    private Horse getOwnedHorse(Integer horseId) {
        // Query ngựa theo horseId và ownerId để đảm bảo owner chỉ thao tác với ngựa của mình.
        Integer ownerId = getCurrentOwner().getUserID();
        return horseRepository.findByHorseIdAndOwnerId(horseId, ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));
    }

    // Lấy user jockey được mời và kiểm tra user đó có role JOCKEY cùng profile hợp lệ.
    private User getJockey(Integer jockeyId) {
        // Query user jockey được mời và kiểm tra role/trạng thái.
        User jockey = userRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nài ngựa không tồn tại."));

        if (jockey.getRole() == null || !ROLE_JOCKEY.equals(jockey.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Người dùng được chọn không phải là nài ngựa.");
        }

        if (!STATUS_ACTIVE.equals(jockey.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản nài ngựa được chọn không hoạt động.");
        }

        // Jockey phải có JockeyProfile thì mới được owner mời tham gia giải.
        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Hồ sơ nài ngựa không tồn tại."));

        return jockey;
    }

    // Kiểm tra ngựa đủ điều kiện đăng ký tournament trước khi owner gửi lời mời.
    private void validateHorseCanRegister(Horse horse, Tournament tournament) {
        // Chỉ ngựa ACTIVE mới được đưa vào quy trình đăng ký giải.
        if (!STATUS_ACTIVE.equals(horse.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ ngựa đang hoạt động mới có thể đăng ký.");
        }

        // Tournament phải đang mở đăng ký.
        if (!TOURNAMENT_OPEN_FOR_REGISTRATION.equals(tournament.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chỉ giải đấu đang mở đăng ký mới có thể nhận đơn đăng ký từ chủ ngựa.");
        }

        // Không cho đăng ký sau hạn đóng đăng ký.
        if (tournament.getRegistrationCloseAt() != null
                && tournament.getRegistrationCloseAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Hạn đăng ký giải đấu đã qua.");
        }

        // Kiểm tra số lượng đăng ký active chưa vượt maxRegistrations.
        if (tournament.getMaxRegistrations() != null) {
            long activeRegistrations = registrationRepository.countByTournamentIdAndStatusIn(
                    tournament.getTournamentId(),
                    ACTIVE_REGISTRATION_STATUSES);
            if (activeRegistrations >= tournament.getMaxRegistrations()) {
                throw new ApiException(HttpStatus.CONFLICT, "Giải đấu đã đạt số người tham gia tối đa.");
            }
        }
    }

    // Đảm bảo hạn phản hồi lời mời jockey không vượt quá hạn đăng ký tournament.
    private void validateInvitationExpiry(LocalDateTime expiredAt, Tournament tournament) {
        // Hạn phản hồi lời mời phải trước hạn đóng đăng ký của tournament.
        if (expiredAt == null || tournament.getRegistrationCloseAt() == null) {
            return;
        }

        if (!expiredAt.isBefore(tournament.getRegistrationCloseAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Thời hạn lời mời phải trước hạn đăng ký của giải đấu.");
        }
    }

    // Chuyển entity Horse sang HorseResponse và bổ sung thông tin registration của ngựa.
    private HorseResponse mapHorseToResponse(Horse horse) {
        // Lấy danh sách registration để tính số lần đăng ký và trạng thái đang tham gia.
        List<Integer> registrationIds = registrationRepository.findRegistrationIdsByHorseId(horse.getHorseId());
        return HorseResponse.builder()
                .horseId(horse.getHorseId())
                .ownerId(horse.getOwnerId())
                .horseName(horse.getHorseName())
                .age(horse.getAge())
                .dayOfBirth(horse.getDayOfBirth())
                .weight(horse.getWeight())
                .colour(horse.getColour())
                .sex(horse.getSex())
                .breeding(horse.getBreeding())
                .trainer(horse.getTrainer())
                .healthCertExpiry(horse.getHealthCertExpiry())
                .healthCertificateUrl(horse.getHealthCertificateUrl())
                .officialHorseProfileUrl(horse.getOfficialHorseProfileUrl())
                .status(horse.getStatus())
                .rejectionReason(horse.getRejectionReason())
                .createdAt(horse.getCreatedAt())
                .updatedAt(horse.getUpdatedAt())
                .registrationCount(registrationIds.size())
                .participated(hasActiveRegistration(registrationIds))
                .performance(mapHorsePerformance(horse.getHorseId()))
                .build();
    }

    private HorsePerformanceResponse mapHorsePerformance(Integer horseId) {
        HorsePerformanceSummary summary = horsePerformanceSummaryRepository.findById(horseId)
                .orElse(null);
        return HorsePerformanceResponse.builder()
                .horseId(horseId)
                .totalRaces(summary != null ? value(summary.getTotalRaces()) : 0)
                .top1Count(summary != null ? value(summary.getTop1Count()) : 0)
                .top2Count(summary != null ? value(summary.getTop2Count()) : 0)
                .top3Count(summary != null ? value(summary.getTop3Count()) : 0)
                .violationCount(summary != null ? value(summary.getViolationCount()) : 0)
                .disqualifiedCount(summary != null ? value(summary.getDisqualifiedCount()) : 0)
                .lastUpdatedAt(summary != null ? summary.getLastUpdatedAt() : null)
                .build();
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }

    // Tính tuổi ngựa từ ngày sinh và validate tuổi phải hợp lệ.
    private int calculateAge(LocalDate dayOfBirth) {
        // Ngày sinh là bắt buộc để tính tuổi ngựa.
        if (dayOfBirth == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Day of birth is required.");
        }
        int age = Period.between(dayOfBirth, LocalDate.now()).getYears();
        // Tuổi ngựa phải lớn hơn 0, tránh ngày sinh ở hiện tại/tương lai.
        if (age <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Horse age must be greater than 0.");
        }
        return age;
    }

    private String storeHealthCertificate(MultipartFile file) {
        // Validate file trước khi upload lên storage.
        validateHealthCertificateFile(file);
        FileUploadResponse uploaded = fileUploadService.upload(
                file,
                "horse-health-certificates"
        );
        return uploaded.getUrl();
    }

    private void validateHealthCertificateFile(MultipartFile file) {
        // File giấy chứng nhận sức khỏe là bắt buộc khi tạo hồ sơ ngựa.
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Health Certificate file is required.");
        }

        // Chỉ cho phép PDF/JPG/JPEG/PNG theo cả extension và content-type.
        String extension = getFileExtension(file.getOriginalFilename());
        String contentType = String.valueOf(file.getContentType()).toLowerCase(Locale.ROOT);
        boolean allowedExtension = List.of("pdf", "jpg", "jpeg", "png").contains(extension);
        boolean allowedType = List.of("application/pdf", "image/jpeg", "image/png").contains(contentType);

        if (!allowedExtension || !allowedType) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Health Certificate file only supports PDF, JPG, JPEG or PNG.");
        }
    }

    private String getFileExtension(String filename) {
        // Tách extension từ tên file để kiểm tra định dạng upload.
        if (filename == null || filename.isBlank() || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private boolean hasActiveRegistration(Integer horseId) {
        // Lấy danh sách registration của ngựa rồi kiểm tra trạng thái active.
        return hasActiveRegistration(registrationRepository.findRegistrationIdsByHorseId(horseId));
    }

    // Kiểm tra danh sách registration có trạng thái active như PENDING hoặc APPROVED.
    private boolean hasActiveRegistration(Collection<Integer> registrationIds) {
        // Registration active gồm PENDING hoặc APPROVED.
        return !registrationIds.isEmpty()
                && registrationRepository.countByRegistrationIdInAndStatusIn(
                registrationIds,
                ACTIVE_REGISTRATION_STATUSES) > 0;
    }

    private Tournament getTournament(Integer tournamentId) {
        // Query tournament theo ID để dùng cho validate invitation/registration.
        return tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại."));
    }

    private String normalizeText(String value) {
        // Chuẩn hóa chuỗi input trước khi lưu DB.
        return value == null ? null : value.trim();
    }

}
