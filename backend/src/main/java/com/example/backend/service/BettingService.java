package com.example.backend.service;

import com.example.backend.constant.BetEventStatus;
import com.example.backend.constant.BetProductCode;
import com.example.backend.constant.BetTicketStatus;
import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.WalletReferenceType;
import com.example.backend.constant.WalletStatus;
import com.example.backend.constant.WalletTransactionType;
import com.example.backend.dto.request.CreateBetEventRequest;
import com.example.backend.dto.request.PlaceBetRequest;
import com.example.backend.dto.request.UpdateBetEventCloseTimeRequest;
import com.example.backend.dto.request.UpdateBetProductRequest;
import com.example.backend.dto.response.AdminBetEventDetailResponse;
import com.example.backend.dto.response.AdminBetSettlementDetailResponse;
import com.example.backend.dto.response.AdminBetSettlementSummaryResponse;
import com.example.backend.dto.response.AdminBetTicketResponse;
import com.example.backend.dto.response.AdminBettingEligibleRaceResponse;
import com.example.backend.dto.response.BetEntryOptionResponse;
import com.example.backend.dto.response.BetEventResponse;
import com.example.backend.dto.response.BetProductResponse;
import com.example.backend.dto.response.BetSettlementResponse;
import com.example.backend.dto.response.BetTicketResponse;
import com.example.backend.entity.BetEvent;
import com.example.backend.entity.BetProduct;
import com.example.backend.entity.BetSettlement;
import com.example.backend.entity.BetTicket;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RaceResult;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;
import com.example.backend.entity.UserVerification;
import com.example.backend.entity.Wallet;
import com.example.backend.entity.WalletTransaction;
import com.example.backend.enums.KycStatus;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.BetEventRepository;
import com.example.backend.repository.BetProductRepository;
import com.example.backend.repository.BetSettlementRepository;
import com.example.backend.repository.BetTicketRepository;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.UserVerificationRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Period;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BettingService {

    private static final BigDecimal DEFAULT_MIN_STAKE = new BigDecimal("10000.00");
    private static final BigDecimal DEFAULT_MINIMUM_ODDS = new BigDecimal("1.0500");
    private static final int MIN_CLOSE_BEFORE_RACE_MINUTES = 5;
    private static final String SETTLEMENT_PAID = "PAID";
    private static final String SETTLEMENT_VOIDED = "VOIDED";
    private static final String VOID_NO_WINNING_BETS = "NO_WINNING_BETS";
    private static final String VOID_INSUFFICIENT_SYSTEM_RESERVE = "INSUFFICIENT_SYSTEM_RESERVE";
    public static final String VOID_REJECTED_RACE_RESULT = "RACE_RESULT_REJECTED";
    private static final Set<String> EDITABLE_SCHEDULE_STATUSES =
            Set.of(BetEventStatus.DRAFT, BetEventStatus.OPEN, BetEventStatus.CLOSED);
    private static final Set<String> ACTIVE_TICKET_STATUSES =
            Set.of(BetTicketStatus.PLACED, BetTicketStatus.WON, BetTicketStatus.LOST);

    private final BetProductRepository betProductRepository;
    private final BetEventRepository betEventRepository;
    private final BetTicketRepository betTicketRepository;
    private final BetSettlementRepository betSettlementRepository;
    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceResultRepository raceResultRepository;
    private final RegistrationRepository registrationRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final UserVerificationRepository userVerificationRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final FundAccountingService fundAccountingService;

    @Transactional(readOnly = true)
    public List<BetProductResponse> getProducts() {
        return betProductRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(BetProduct::getCode))
                .map(this::toProductResponse)
                .toList();
    }

    @Transactional
    public BetProductResponse updateProduct(Integer productId, UpdateBetProductRequest request) {
        BetProduct product = betProductRepository.findById(productId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet product does not exist."));

        BigDecimal minStake = normalizeMoney(request.getMinStake());
        BigDecimal maxDailyStake = normalizeMoney(request.getMaxDailyStake());
        if (maxDailyStake.compareTo(minStake) < 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum daily stake cannot be lower than minimum stake."
            );
        }

        product.setName(request.getName().trim());
        product.setDescription(trimToNull(request.getDescription()));
        product.setMinStake(minStake);
        product.setMaxDailyStake(maxDailyStake);
        product.setOperatorFeeRate(normalizeRate(request.getOperatorFeeRate()));
        product.setMinimumOdds(normalizeMinimumOdds(request.getMinimumOdds()));
        product.setActive(request.getActive());

        return toProductResponse(betProductRepository.save(product));
    }

    @Transactional(readOnly = true)
    public List<BetEventResponse> getVisibleEvents() {
        // DRAFT hiện đại diện cho event đã lên lịch và được trình bày là "sắp mở".
        // OPEN là đang/sắp nhận cược theo openAt; CLOSED giữ lại cho bộ lọc lịch sử.
        return betEventRepository.findByStatusInOrderByOpenAtAsc(
                        List.of(BetEventStatus.DRAFT, BetEventStatus.OPEN, BetEventStatus.CLOSED)
                )
                .stream()
                .map(event -> toEventResponse(event, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BetEventResponse> getAdminEvents() {
        return betEventRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(BetEvent::getOpenAt).reversed())
                .map(event -> toEventResponse(event, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminBettingEligibleRaceResponse> getEligibleRaces(Integer betProductId) {
        // Loại Race quá sát giờ vì không còn đủ mốc đóng cược tối thiểu 5 phút.
        getActiveProduct(betProductId);
        LocalDateTime latestEligibleCutoff = LocalDateTime.now()
                .plusMinutes(MIN_CLOSE_BEFORE_RACE_MINUTES);
        return raceRepository.findEligibleForBetting(
                        betProductId,
                        EventStatus.ENTRIES_FINALIZED,
                        latestEligibleCutoff
                )
                .stream()
                .map(race -> AdminBettingEligibleRaceResponse.builder()
                        .raceId(race.getRaceId())
                        .raceName(race.getRaceName())
                        .trackName(race.getTrackName())
                        .raceStartTime(race.getRaceStartTime())
                        .status(race.getStatus())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminBetEventDetailResponse getAdminEventDetail(Integer eventId, String adminEmail) {
        // Detail đã trả kèm ticket nên không cần duy trì thêm API tickets riêng lẻ.
        getAdmin(adminEmail);
        BetEvent event = getEventOrThrow(eventId);
        return AdminBetEventDetailResponse.builder()
                .event(toEventResponse(event, true))
                .tickets(getAdminTicketsForEvent(event.getBetEventId()))
                .settlement(betSettlementRepository.findByBetEventId(event.getBetEventId())
                        .map(this::toSettlementResponse)
                        .orElse(null))
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminBetSettlementSummaryResponse> getAdminSettlements(String adminEmail) {
        getAdmin(adminEmail);
        return betSettlementRepository.findAllByOrderBySettledAtDesc()
                .stream()
                .map(this::toAdminSettlementSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminBetSettlementDetailResponse getAdminSettlementDetail(Integer settlementId, String adminEmail) {
        getAdmin(adminEmail);
        BetSettlement settlement = betSettlementRepository.findById(settlementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet settlement does not exist."));
        return AdminBetSettlementDetailResponse.builder()
                .settlement(toAdminSettlementSummaryResponse(settlement))
                .tickets(getAdminTicketsForEvent(settlement.getBetEventId()))
                .build();
    }

    @Transactional(readOnly = true)
    public BetEventResponse getEvent(Integer eventId) {
        BetEvent event = getEventOrThrow(eventId);
        return toEventResponse(event, true);
    }

    @Transactional
    public BetEventResponse createEvent(CreateBetEventRequest request, String adminEmail) {
        // Khóa Race để trạng thái finalize và giờ chạy không đổi trong lúc tạo BetEvent.
        User admin = getAdmin(adminEmail);
        boolean openNow = Boolean.TRUE.equals(request.getOpenNow());
        if (!openNow && request.getOpenAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Scheduled open time is required.");
        }
        LocalDateTime effectiveOpenAt = openNow ? LocalDateTime.now() : request.getOpenAt();
        Race race = raceRepository.findByIdForUpdate(request.getRaceId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race does not exist."));
        BetProduct product = getActiveProduct(request.getBetProductId());
        validateRaceCanHostBetting(race);
        if (betEventRepository.existsByRaceIdAndBetProductIdAndStatusNot(
                race.getRaceId(),
                product.getBetProductId(),
                BetEventStatus.CANCELLED
        )) {
            throw new ApiException(HttpStatus.CONFLICT, "Bet event already exists for this race and product.");
        }
        if (!openNow && request.getOpenAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Scheduled open time must be in the future.");
        }
        validateEventWindow(race, effectiveOpenAt, request.getCloseAt());

        BetEvent event = new BetEvent();
        event.setRaceId(race.getRaceId());
        event.setBetProductId(product.getBetProductId());
        Integer lastAttempt = betEventRepository.findMaxAttemptNumber(
                race.getRaceId(),
                product.getBetProductId()
        );
        event.setAttemptNumber(lastAttempt == null ? 1 : lastAttempt + 1);
        // Open now được ghi OPEN ngay trong cùng transaction; lịch tương lai giữ DRAFT cho scheduler.
        event.setStatus(openNow ? BetEventStatus.OPEN : BetEventStatus.DRAFT);
        event.setOpenAt(effectiveOpenAt);
        event.setCloseAt(request.getCloseAt());
        event.setOperatorFeeRate(request.getOperatorFeeRate() != null
                ? normalizeRate(request.getOperatorFeeRate())
                : normalizeRate(product.getOperatorFeeRate()));
        event.setCreatedBy(admin.getUserID());

        return toEventResponse(betEventRepository.save(event), true);
    }

    @Transactional
    public BetEventResponse updateEventCloseTime(
            Integer eventId,
            UpdateBetEventCloseTimeRequest request
    ) {
        // Khóa BetEvent để không sửa closeAt đồng thời với place bet, đóng event hoặc settlement.
        BetEvent event = betEventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet event does not exist."));
        if (!EDITABLE_SCHEDULE_STATUSES.contains(event.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only draft, open, or closed betting events can update close time."
            );
        }

        Race race = getRace(event.getRaceId());
        validateRaceCanHostBetting(race);
        validateEventWindow(race, event.getOpenAt(), request.getCloseAt());

        event.setCloseAt(request.getCloseAt());
        return toEventResponse(betEventRepository.save(event), true);
    }

    @Transactional
    public BetEventResponse openEvent(Integer eventId) {
        // Event chỉ được mở khi Race còn hợp lệ và toàn bộ cửa thời gian vẫn còn hiệu lực.
        BetEvent event = betEventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet event does not exist."));
        if (!BetEventStatus.DRAFT.equals(event.getStatus())
                && !BetEventStatus.CLOSED.equals(event.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only draft or closed betting events can be opened.");
        }
        validateEventCanOpen(event);
        event.setStatus(BetEventStatus.OPEN);
        return toEventResponse(betEventRepository.save(event), true);
    }

    @Transactional
    public BetEventResponse closeEvent(Integer eventId) {
        // Đóng thủ công sớm hơn closeAt; scheduler xử lý trường hợp hết giờ tự nhiên.
        BetEvent event = betEventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet event does not exist."));
        if (!BetEventStatus.OPEN.equals(event.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only open betting events can be closed.");
        }
        event.setStatus(BetEventStatus.CLOSED);
        return toEventResponse(betEventRepository.save(event), true);
    }

    @Transactional
    public int closeExpiredOpenEvents() {
        // Một câu update nguyên tử giữ trạng thái UI/API đồng bộ với closeAt.
        LocalDateTime now = LocalDateTime.now();
        return betEventRepository.closeExpiredOpenEvents(
                BetEventStatus.OPEN,
                BetEventStatus.CLOSED,
                now
        );
    }

    @Transactional
    public int openScheduledEvents() {
        // Update nguyên tử giúp scheduler và thao tác Open thủ công không mở trùng event.
        LocalDateTime now = LocalDateTime.now();
        return betEventRepository.openScheduledDraftEvents(
                BetEventStatus.DRAFT,
                BetEventStatus.OPEN,
                EventStatus.ENTRIES_FINALIZED,
                now
        );
    }

    @Transactional
    public BetTicketResponse placeBet(Integer eventId, PlaceBetRequest request, String email) {
        // Lấy user đặt cược và kiểm tra role, KYC, độ tuổi trước khi xử lý tiền.
        User user = getUser(email);
        validatePlayerRole(user);
        UserVerification verification = validateBettingKyc(user);
        validateAge(verification);

        // Lock betting event để tránh thay đổi trạng thái khi đang đặt cược.
        BetEvent event = betEventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet event does not exist."));
        BetProduct product = getProduct(event.getBetProductId());
        Race race = getRace(event.getRaceId());
        validateEventIsBettable(event, race);

        // Kiểm tra race entry được chọn có thuộc race này và đã được phân slot chính thức.
        RaceEntry raceEntry = raceEntryRepository.findById(request.getRaceEntryId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race entry does not exist."));
        if (!event.getRaceId().equals(raceEntry.getRaceId())
                || !RaceEntryStatus.ASSIGNED.equals(raceEntry.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Race entry is not available for this betting event.");
        }

        // Không cho owner hoặc jockey của entry tự đặt cược vào ngựa của mình.
        Registration registration = registrationRepository.findById(raceEntry.getRegistrationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race registration does not exist."));
        if (user.getUserID().equals(registration.getOwnerId())
                || user.getUserID().equals(registration.getJockeyId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Race participants cannot bet on their own race entry.");
        }

        // Chuẩn hóa tiền cược và kiểm tra giới hạn theo product/ngày.
        BigDecimal stake = normalizeMoney(request.getStake());
        if (stake.compareTo(max(product.getMinStake(), DEFAULT_MIN_STAKE)) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Stake is lower than the product minimum stake.");
        }
        validateDailyLimit(user.getUserID(), product, stake);

        // Lock wallet để kiểm tra và cập nhật số dư khóa một cách nhất quán.
        Wallet wallet = walletRepository.findByUserIdForUpdate(user.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Wallet is not opened."));
        ensureWalletActive(wallet);
        BigDecimal available = valueOrZero(wallet.getBalance()).subtract(valueOrZero(wallet.getLockedBalance()));
        if (available.compareTo(stake) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Wallet balance is not enough for this bet.");
        }

        // Tạo vé cược ở trạng thái PLACED.
        BigDecimal estimatedOdds = calculateEstimatedOdds(event, raceEntry.getRaceEntryId(), stake);

        BetTicket ticket = new BetTicket();
        ticket.setBetEventId(event.getBetEventId());
        ticket.setUserId(user.getUserID());
        ticket.setWalletId(wallet.getWalletId());
        ticket.setRaceId(event.getRaceId());
        ticket.setRaceEntryId(raceEntry.getRaceEntryId());
        ticket.setStake(stake);
        ticket.setEstimatedOddsAtBet(estimatedOdds);
        ticket.setStatus(BetTicketStatus.PLACED);
        ticket.setPlacedAt(LocalDateTime.now());
        BetTicket savedTicket = betTicketRepository.save(ticket);

        // Khóa số tiền cược trong ví cho đến khi hủy hoặc settle.
        BigDecimal balanceBefore = valueOrZero(wallet.getBalance());
        BigDecimal lockedBefore = valueOrZero(wallet.getLockedBalance());
        BigDecimal lockedAfter = lockedBefore.add(stake);
        wallet.setLockedBalance(lockedAfter);
        walletRepository.save(wallet);

        saveWalletTransaction(
                wallet,
                WalletTransactionType.BET_LOCK,
                stake,
                balanceBefore,
                balanceBefore,
                lockedBefore,
                lockedAfter,
                WalletReferenceType.BET_TICKET,
                savedTicket.getBetTicketId(),
                "Lock stake for betting ticket"
        );

        return toTicketResponse(savedTicket);
    }

    @Transactional(readOnly = true)
    public List<BetTicketResponse> getMyTickets(String email) {
        User user = getUser(email);
        return betTicketRepository.findByUserIdOrderByPlacedAtDesc(user.getUserID())
                .stream()
                .map(this::toTicketResponse)
                .toList();
    }

    @Transactional
    public BetTicketResponse cancelTicket(Integer ticketId, String email) {
        User user = getUser(email);
        validatePlayerRole(user);

        BetTicket ticketSnapshot = betTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet ticket does not exist."));
        BetEvent event = betEventRepository.findByIdForUpdate(ticketSnapshot.getBetEventId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Betting event does not exist."));
        BetTicket ticket = betTicketRepository.findByIdForUpdate(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet ticket does not exist."));
        if (!user.getUserID().equals(ticket.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only cancel your own bet ticket.");
        }
        if (!BetTicketStatus.PLACED.equals(ticket.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only placed bet tickets can be cancelled.");
        }

        Race race = getRace(event.getRaceId());
        validateTicketCanBeCancelled(event, race);

        Wallet wallet = walletRepository.findByWalletIdForUpdate(ticket.getWalletId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wallet does not exist."));
        BigDecimal balanceBefore = valueOrZero(wallet.getBalance());
        BigDecimal lockedBefore = valueOrZero(wallet.getLockedBalance());
        BigDecimal stake = valueOrZero(ticket.getStake());
        BigDecimal lockedAfter = lockedBefore.subtract(stake).max(BigDecimal.ZERO);

        wallet.setLockedBalance(lockedAfter);
        walletRepository.save(wallet);

        ticket.setStatus(BetTicketStatus.REFUNDED);
        ticket.setFinalOdds(BigDecimal.ONE.setScale(4, RoundingMode.HALF_UP));
        ticket.setPayoutAmount(stake.setScale(2, RoundingMode.HALF_UP));
        ticket.setRefundReason("USER_CANCELLED");
        ticket.setSettledAt(LocalDateTime.now());
        BetTicket savedTicket = betTicketRepository.save(ticket);

        // Lưu lịch sử giao dịch khóa tiền cho vé cược.
        saveWalletTransaction(
                wallet,
                WalletTransactionType.BET_REFUND,
                stake,
                balanceBefore,
                balanceBefore,
                lockedBefore,
                lockedAfter,
                WalletReferenceType.BET_TICKET,
                ticket.getBetTicketId(),
                "Cancel betting ticket and unlock stake"
        );

        return toTicketResponse(savedTicket);
    }

    @Transactional
    public BetSettlementResponse settleEvent(Integer eventId, String adminEmail) {
        User admin = getAdmin(adminEmail);
        BetEvent event = betEventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet event does not exist."));
        return settleEventForAdmin(event, admin.getUserID(), false);
    }

    @Transactional
    public List<BetSettlementResponse> settleRaceEvents(Integer raceId, Integer settledByUserId) {
        List<BetEvent> events = betEventRepository.findByRaceIdAndStatusInForUpdate(
                raceId,
                List.of(BetEventStatus.OPEN, BetEventStatus.CLOSED)
        );
        return events.stream()
                .filter(this::isReadyForAutoSettlement)
                .map(event -> settleEventForAdmin(event, settledByUserId, true))
                .toList();
    }

    @Transactional
    public List<BetSettlementResponse> voidRaceEvents(
            Integer raceId,
            Integer voidedByUserId,
            String reason
    ) {
        List<BetEvent> events = betEventRepository.findByRaceIdAndStatusInForUpdate(
                raceId,
                List.of(BetEventStatus.DRAFT, BetEventStatus.OPEN, BetEventStatus.CLOSED)
        );
        return events.stream()
                .map(event -> voidEventAndRefund(
                        event,
                        betTicketRepository.findPlacedByEventForUpdate(
                                event.getBetEventId(),
                                BetTicketStatus.PLACED
                        ),
                        voidedByUserId,
                        reason
                ))
                .toList();
    }

    private BetSettlementResponse settleEventForAdmin(
            BetEvent event,
            Integer settledByUserId,
            boolean closeAutomatically
    ) {
        Integer eventId = event.getBetEventId();
        if (BetEventStatus.SETTLED.equals(event.getStatus())) {
            return betSettlementRepository.findByBetEventId(eventId)
                    .map(this::toSettlementResponse)
                    .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Settlement data is missing."));
        }
        if (closeAutomatically && BetEventStatus.OPEN.equals(event.getStatus())) {
            event.setStatus(BetEventStatus.CLOSED);
        }
        if (!BetEventStatus.CLOSED.equals(event.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Betting event must be closed before settlement.");
        }
        if (betSettlementRepository.existsByBetEventId(eventId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Betting event has already been settled.");
        }

        BetProduct product = getProduct(event.getBetProductId());
        List<RaceResult> results = raceResultRepository.findByRaceIdOrderByFinishPositionAsc(
                event.getRaceId()
        );
        if (results.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Official race results are required before settlement.");
        }

        Set<Integer> winningEntryIds = getWinningEntryIds(product.getCode(), results);
        List<BetTicket> tickets = betTicketRepository.findPlacedByEventForUpdate(
                eventId,
                BetTicketStatus.PLACED
        );
        BigDecimal totalStake = tickets.stream()
                .map(BetTicket::getStake)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal winningStake = tickets.stream()
                .filter(ticket -> winningEntryIds.contains(ticket.getRaceEntryId()))
                .map(BetTicket::getStake)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal losingStake = totalStake.subtract(winningStake);
        BigDecimal operatorFee = totalStake.multiply(event.getOperatorFeeRate()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal payoutPool = totalStake.subtract(operatorFee);

        if (!tickets.isEmpty() && winningStake.signum() == 0) {
            return voidEventAndRefund(event, tickets, settledByUserId, VOID_NO_WINNING_BETS);
        }

        BigDecimal minimumOdds = normalizeMinimumOdds(product.getMinimumOdds());
        BigDecimal rawOdds = winningStake.signum() > 0
                ? payoutPool.divide(winningStake, 4, RoundingMode.HALF_UP)
                : null;
        BigDecimal finalOdds = rawOdds == null ? null : rawOdds.max(minimumOdds);
        BigDecimal totalPayout = tickets.stream()
                .filter(ticket -> winningEntryIds.contains(ticket.getRaceEntryId()))
                .map(ticket -> valueOrZero(ticket.getStake())
                        .multiply(finalOdds)
                        .setScale(2, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal subsidyAmount = totalPayout.subtract(payoutPool).max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal theoreticalPayout = finalOdds == null
                ? BigDecimal.ZERO
                : winningStake.multiply(finalOdds).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roundingAdjustment = totalPayout.subtract(theoreticalPayout)
                .setScale(2, RoundingMode.HALF_UP);

        if (!fundAccountingService.canCoverBettingSettlement(operatorFee, subsidyAmount)) {
            return voidEventAndRefund(
                    event,
                    tickets,
                    settledByUserId,
                    VOID_INSUFFICIENT_SYSTEM_RESERVE
            );
        }

        BetSettlement settlement = new BetSettlement();
        settlement.setBetEventId(eventId);
        settlement.setTotalStake(totalStake.setScale(2, RoundingMode.HALF_UP));
        settlement.setWinningStake(winningStake.setScale(2, RoundingMode.HALF_UP));
        settlement.setLosingStake(losingStake.setScale(2, RoundingMode.HALF_UP));
        settlement.setOperatorFee(operatorFee);
        settlement.setPayoutPool(payoutPool.setScale(2, RoundingMode.HALF_UP));
        settlement.setGrossPool(totalStake.setScale(2, RoundingMode.HALF_UP));
        settlement.setNetPool(payoutPool.setScale(2, RoundingMode.HALF_UP));
        settlement.setRawOdds(rawOdds);
        settlement.setMinimumOdds(minimumOdds);
        settlement.setFinalOdds(finalOdds);
        settlement.setTotalPayout(totalPayout.setScale(2, RoundingMode.HALF_UP));
        settlement.setSubsidyAmount(subsidyAmount);
        settlement.setRoundingAdjustment(roundingAdjustment);
        settlement.setOutcome(SETTLEMENT_PAID);
        settlement.setSettledBy(settledByUserId);
        settlement.setSettledAt(LocalDateTime.now());
        BetSettlement savedSettlement = betSettlementRepository.save(settlement);
        fundAccountingService.recordBettingSettlement(savedSettlement);

        for (BetTicket ticket : tickets) {
            settleTicket(
                    ticket,
                    winningEntryIds.contains(ticket.getRaceEntryId()),
                    finalOdds
            );
        }

        event.setStatus(BetEventStatus.SETTLED);
        event.setSettledBy(settledByUserId);
        event.setSettledAt(savedSettlement.getSettledAt());
        betEventRepository.save(event);

        return toSettlementResponse(savedSettlement);
    }

    private boolean isReadyForAutoSettlement(BetEvent event) {
        if (BetEventStatus.CLOSED.equals(event.getStatus())) {
            return true;
        }
        return BetEventStatus.OPEN.equals(event.getStatus())
                && event.getCloseAt() != null
                && !event.getCloseAt().isAfter(LocalDateTime.now());
    }

    private void settleTicket(
            BetTicket ticket,
            boolean won,
            BigDecimal finalOdds
    ) {
        Wallet wallet = walletRepository.findByWalletIdForUpdate(ticket.getWalletId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wallet does not exist."));
        BigDecimal balanceBefore = valueOrZero(wallet.getBalance());
        BigDecimal lockedBefore = valueOrZero(wallet.getLockedBalance());
        BigDecimal stake = valueOrZero(ticket.getStake());
        BigDecimal lockedAfter = lockedBefore.subtract(stake).max(BigDecimal.ZERO);

        if (!won) {
            BigDecimal balanceAfter = balanceBefore.subtract(stake);
            wallet.setBalance(balanceAfter);
            wallet.setLockedBalance(lockedAfter);
            walletRepository.save(wallet);

            ticket.setStatus(BetTicketStatus.LOST);
            ticket.setFinalOdds(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
            ticket.setPayoutAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            ticket.setSettledAt(LocalDateTime.now());
            betTicketRepository.save(ticket);

            saveWalletTransaction(wallet, WalletTransactionType.BET_LOST, stake,
                    balanceBefore, balanceAfter, lockedBefore, lockedAfter,
                    WalletReferenceType.BET_TICKET, ticket.getBetTicketId(), "Settle losing betting ticket");
            return;
        }

        BigDecimal payout = stake.multiply(finalOdds).setScale(2, RoundingMode.HALF_UP);
        BigDecimal balanceAfter = balanceBefore.add(payout.subtract(stake));

        wallet.setBalance(balanceAfter);
        wallet.setLockedBalance(lockedAfter);
        walletRepository.save(wallet);

        ticket.setStatus(BetTicketStatus.WON);
        ticket.setFinalOdds(finalOdds);
        ticket.setPayoutAmount(payout);
        ticket.setSettledAt(LocalDateTime.now());
        betTicketRepository.save(ticket);

        saveWalletTransaction(wallet, WalletTransactionType.BET_WIN, payout,
                balanceBefore, balanceAfter, lockedBefore, lockedAfter,
                WalletReferenceType.BET_TICKET, ticket.getBetTicketId(), "Settle winning betting ticket");
    }

    private BetSettlementResponse voidEventAndRefund(
            BetEvent event,
            List<BetTicket> tickets,
            Integer voidedByUserId,
            String reason
    ) {
        LocalDateTime now = LocalDateTime.now();
        BigDecimal totalStake = tickets.stream()
                .map(BetTicket::getStake)
                .map(this::valueOrZero)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        for (BetTicket ticket : tickets) {
            refundVoidedTicket(ticket, reason, now);
        }

        BetSettlement settlement = new BetSettlement();
        settlement.setBetEventId(event.getBetEventId());
        settlement.setTotalStake(totalStake);
        settlement.setWinningStake(BigDecimal.ZERO.setScale(2));
        settlement.setLosingStake(BigDecimal.ZERO.setScale(2));
        settlement.setOperatorFee(BigDecimal.ZERO.setScale(2));
        settlement.setPayoutPool(BigDecimal.ZERO.setScale(2));
        settlement.setGrossPool(totalStake);
        settlement.setNetPool(BigDecimal.ZERO.setScale(2));
        settlement.setMinimumOdds(DEFAULT_MINIMUM_ODDS);
        settlement.setTotalPayout(totalStake);
        settlement.setSubsidyAmount(BigDecimal.ZERO.setScale(2));
        settlement.setRoundingAdjustment(BigDecimal.ZERO.setScale(2));
        settlement.setOutcome(SETTLEMENT_VOIDED);
        settlement.setVoidReason(reason);
        settlement.setSettledBy(voidedByUserId);
        settlement.setSettledAt(now);
        BetSettlement savedSettlement = betSettlementRepository.save(settlement);

        event.setStatus(BetEventStatus.CANCELLED);
        event.setSettledBy(voidedByUserId);
        event.setSettledAt(now);
        betEventRepository.save(event);
        return toSettlementResponse(savedSettlement);
    }

    private void refundVoidedTicket(BetTicket ticket, String reason, LocalDateTime now) {
        Wallet wallet = walletRepository.findByWalletIdForUpdate(ticket.getWalletId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wallet does not exist."));
        BigDecimal balanceBefore = valueOrZero(wallet.getBalance());
        BigDecimal lockedBefore = valueOrZero(wallet.getLockedBalance());
        BigDecimal stake = valueOrZero(ticket.getStake());
        BigDecimal lockedAfter = lockedBefore.subtract(stake).max(BigDecimal.ZERO);

        wallet.setLockedBalance(lockedAfter);
        walletRepository.save(wallet);

        ticket.setStatus(BetTicketStatus.VOID);
        ticket.setFinalOdds(BigDecimal.ONE.setScale(4));
        ticket.setPayoutAmount(stake.setScale(2, RoundingMode.HALF_UP));
        ticket.setRefundReason(reason);
        ticket.setVoidedAt(now);
        ticket.setSettledAt(now);
        betTicketRepository.save(ticket);

        saveWalletTransaction(
                wallet,
                WalletTransactionType.BET_VOID_REFUND,
                stake,
                balanceBefore,
                balanceBefore,
                lockedBefore,
                lockedAfter,
                WalletReferenceType.BET_TICKET,
                ticket.getBetTicketId(),
                "Void betting ticket and release stake: " + reason
        );
    }

    private Set<Integer> getWinningEntryIds(String productCode, List<RaceResult> results) {
        String normalized = productCode != null ? productCode.toUpperCase() : "";
        if (BetProductCode.PLACE.equals(normalized)) {
            return results.stream()
                    .filter(result -> result.getFinishPosition() != null && result.getFinishPosition() <= 3)
                    .map(RaceResult::getRaceEntryId)
                    .collect(Collectors.toSet());
        }
        if (!BetProductCode.WIN.equals(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported bet product.");
        }
        return results.stream()
                .filter(result -> Integer.valueOf(1).equals(result.getFinishPosition()))
                .map(RaceResult::getRaceEntryId)
                .collect(Collectors.toSet());
    }

    private void validateEventCanOpen(BetEvent event) {
        // Dùng chung validation với create/update và chặn mở lại event đã hết giờ.
        Race race = getRace(event.getRaceId());
        validateRaceCanHostBetting(race);
        validateEventWindow(race, event.getOpenAt(), event.getCloseAt());
    }

    private void validateRaceCanHostBetting(Race race) {
        // Danh sách ngựa phải được Admin khóa trước khi cấu hình hay mở cược.
        if (!EventStatus.ENTRIES_FINALIZED.equals(race.getStatus())
                || race.getEntryFinalizedAt() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race entries must be finalized before betting can be configured."
            );
        }
        if (!LocalDateTime.now().isBefore(race.getRaceStartTime())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Betting cannot be configured after the race starts."
            );
        }
    }

    private void validateEventWindow(Race race, LocalDateTime openAt, LocalDateTime closeAt) {
        // Một nguồn validation duy nhất cho tạo event, chỉnh closeAt và mở event.
        if (!openAt.isBefore(closeAt)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Betting open time must be before close time.");
        }
        if (!LocalDateTime.now().isBefore(closeAt)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Close time must be in the future.");
        }
        if (closeAt.isAfter(race.getRaceStartTime().minusMinutes(MIN_CLOSE_BEFORE_RACE_MINUTES))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Betting must close at least 5 minutes before race start.");
        }
    }

    private void validateEventIsBettable(BetEvent event, Race race) {
        // Event phải OPEN, đang trong khung giờ nhận cược và race chưa bắt đầu.
        LocalDateTime now = LocalDateTime.now();
        if (!BetEventStatus.OPEN.equals(event.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Betting event is not open.");
        }
        if (now.isBefore(event.getOpenAt()) || !now.isBefore(event.getCloseAt())) {
            throw new ApiException(HttpStatus.CONFLICT, "Betting event is outside its receiving window.");
        }
        if (!now.isBefore(race.getRaceStartTime())) {
            throw new ApiException(HttpStatus.CONFLICT, "Race has already started.");
        }
    }

    private void validateTicketCanBeCancelled(BetEvent event, Race race) {
        // Chỉ được hủy vé trong thời gian event còn mở và race chưa bắt đầu.
        LocalDateTime now = LocalDateTime.now();
        if (!BetEventStatus.OPEN.equals(event.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only open betting events allow ticket cancellation.");
        }
        if (now.isBefore(event.getOpenAt()) || !now.isBefore(event.getCloseAt())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bet ticket can only be cancelled during the betting window.");
        }
        if (!now.isBefore(race.getRaceStartTime())) {
            throw new ApiException(HttpStatus.CONFLICT, "Race has already started.");
        }
    }

    private void validateDailyLimit(Integer userId, BetProduct product, BigDecimal stake) {
        // Cộng stake hôm nay trong DB để kiểm tra giới hạn cược theo ngày.
        LocalDate today = LocalDate.now();
        BigDecimal used = betTicketRepository.sumDailyStake(
                userId,
                product.getBetProductId(),
                today.atStartOfDay(),
                today.atTime(LocalTime.MAX),
                ACTIVE_TICKET_STATUSES
        );
        BigDecimal afterStake = valueOrZero(used).add(stake);
        if (afterStake.compareTo(product.getMaxDailyStake()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Stake exceeds the daily betting limit for this product.");
        }
    }

    private UserVerification validateBettingKyc(User user) {
        // Betting yêu cầu user đã KYC VERIFIED và KYC chưa hết hạn.
        UserVerification verification = userVerificationRepository
                .findFirstByUserIdAndStatusOrderByAttemptNumberDesc(user.getUserID(), KycStatus.VERIFIED)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "KYC is required before betting."));
        if (KycStatus.VERIFIED != verification.getStatus()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "KYC must be verified before betting.");
        }
        if (verification.getExpiresAt() != null
                && !verification.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "KYC has expired.");
        }
        return verification;
    }

    private void validateAge(UserVerification verification) {
        // Người đặt cược phải đủ 21 tuổi theo ngày sinh đã KYC.
        if (verification.getDateOfBirth() == null
                || Period.between(verification.getDateOfBirth(), LocalDate.now()).getYears() < 21) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Player must be at least 21 years old to bet.");
        }
    }

    private void validatePlayerRole(User user) {
        // Chỉ spectator mới được đặt cược.
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        String accountType = user.getAccountType() == null ? roleName : user.getAccountType();
        if (!"SPECTATOR".equalsIgnoreCase(roleName)
                || !"SPECTATOR".equalsIgnoreCase(accountType)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only spectators can place bets.");
        }
    }

    private void ensureWalletActive(Wallet wallet) {
        // Wallet phải ACTIVE mới được dùng cho betting.
        if (!WalletStatus.ACTIVE.equals(wallet.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Wallet is not active.");
        }
    }

    private BetEventResponse toEventResponse(BetEvent event, boolean includeEntries) {
        Race race = getRace(event.getRaceId());
        BetProduct product = getProduct(event.getBetProductId());
        BigDecimal totalStake = betTicketRepository.sumStakeByEvent(event.getBetEventId(), ACTIVE_TICKET_STATUSES);
        BigDecimal raceTotalStake = betTicketRepository.sumStakeByRace(event.getRaceId(), ACTIVE_TICKET_STATUSES);
        return BetEventResponse.builder()
                .betEventId(event.getBetEventId())
                .raceId(event.getRaceId())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .raceStartTime(race.getRaceStartTime())
                .betProductId(product.getBetProductId())
                .productCode(product.getCode())
                .productName(product.getName())
                .status(event.getStatus())
                .openAt(event.getOpenAt())
                .closeAt(event.getCloseAt())
                .minStake(product.getMinStake())
                .maxDailyStake(product.getMaxDailyStake())
                .operatorFeeRate(event.getOperatorFeeRate())
                .minimumOdds(normalizeMinimumOdds(product.getMinimumOdds()))
                .attemptNumber(event.getAttemptNumber())
                .totalStake(valueOrZero(totalStake))
                .raceTotalStake(valueOrZero(raceTotalStake))
                .entries(includeEntries ? getEntryOptions(event) : List.of())
                .build();
    }

    private List<BetEntryOptionResponse> getEntryOptions(BetEvent event) {
        List<RaceEntry> entries = raceEntryRepository.findByRaceIdAndStatusOrderByStartingStallAsc(
                event.getRaceId(),
                RaceEntryStatus.ASSIGNED
        );
        Map<Integer, Registration> registrations = registrationRepository.findAllById(
                        entries.stream().map(RaceEntry::getRegistrationId).toList()
                )
                .stream()
                .collect(Collectors.toMap(Registration::getRegistrationId, Function.identity()));
        Map<Integer, Horse> horses = horseRepository.findAllById(
                        registrations.values().stream().map(Registration::getHorseId).toList()
                )
                .stream()
                .collect(Collectors.toMap(Horse::getHorseId, Function.identity()));
        Map<Integer, User> users = userRepository.findAllById(
                        registrations.values().stream()
                                .flatMap(registration -> List.of(
                                        registration.getOwnerId(),
                                        registration.getJockeyId()
                                ).stream())
                                .filter(id -> id != null)
                                .distinct()
                                .toList()
                )
                .stream()
                .collect(Collectors.toMap(User::getUserID, Function.identity()));

        return entries.stream()
                .map(entry -> {
                    Registration registration = registrations.get(entry.getRegistrationId());
                    Horse horse = registration == null ? null : horses.get(registration.getHorseId());
                    User owner = registration == null ? null : users.get(registration.getOwnerId());
                    User jockey = registration == null ? null : users.get(registration.getJockeyId());
                    BigDecimal poolStake = betTicketRepository.sumStakeByEventAndRaceEntry(
                            event.getBetEventId(),
                            entry.getRaceEntryId(),
                            ACTIVE_TICKET_STATUSES
                    );
                    return BetEntryOptionResponse.builder()
                            .raceEntryId(entry.getRaceEntryId())
                            .startingStall(entry.getStartingStall())
                            .horseId(horse != null ? horse.getHorseId() : null)
                            .horseName(horse != null ? horse.getHorseName() : null)
                            .ownerId(owner != null ? owner.getUserID() : null)
                            .ownerName(owner != null ? owner.getUsername() : null)
                            .jockeyId(jockey != null ? jockey.getUserID() : null)
                            .jockeyName(jockey != null ? jockey.getUsername() : null)
                            .poolStake(valueOrZero(poolStake))
                            .estimatedOdds(calculateEstimatedOdds(event, entry.getRaceEntryId(), BigDecimal.ZERO))
                            .build();
                })
                .toList();
    }

    private BetTicketResponse toTicketResponse(BetTicket ticket) {
        BetEvent event = getEventOrThrow(ticket.getBetEventId());
        Race race = getRace(ticket.getRaceId());
        BetProduct product = getProduct(event.getBetProductId());
        RaceEntry entry = raceEntryRepository.findById(ticket.getRaceEntryId()).orElse(null);
        String horseName = null;
        Integer startingStall = null;
        if (entry != null) {
            startingStall = entry.getStartingStall();
            Registration registration = registrationRepository.findById(entry.getRegistrationId()).orElse(null);
            if (registration != null) {
                horseName = horseRepository.findById(registration.getHorseId())
                        .map(Horse::getHorseName)
                        .orElse(null);
            }
        }
        return BetTicketResponse.builder()
                .betTicketId(ticket.getBetTicketId())
                .betEventId(ticket.getBetEventId())
                .betEventStatus(event.getStatus())
                .bettingCloseAt(event.getCloseAt())
                .raceId(ticket.getRaceId())
                .raceName(race.getRaceName())
                .productCode(product.getCode())
                .productName(product.getName())
                .raceEntryId(ticket.getRaceEntryId())
                .startingStall(startingStall)
                .horseName(horseName)
                .stake(ticket.getStake())
                .estimatedOddsAtBet(ticket.getEstimatedOddsAtBet())
                .finalOdds(ticket.getFinalOdds())
                .payoutAmount(ticket.getPayoutAmount())
                .netProfit(netProfit(ticket))
                .status(ticket.getStatus())
                .refundReason(ticket.getRefundReason())
                .placedAt(ticket.getPlacedAt())
                .settledAt(ticket.getSettledAt())
                .voidedAt(ticket.getVoidedAt())
                .build();
    }

    private List<AdminBetTicketResponse> getAdminTicketsForEvent(Integer betEventId) {
        return betTicketRepository.findByBetEventIdOrderByPlacedAtAsc(betEventId)
                .stream()
                .map(this::toAdminTicketResponse)
                .toList();
    }

    private AdminBetTicketResponse toAdminTicketResponse(BetTicket ticket) {
        Race race = getRace(ticket.getRaceId());
        RaceEntry entry = raceEntryRepository.findById(ticket.getRaceEntryId()).orElse(null);
        Registration registration = entry == null
                ? null
                : registrationRepository.findById(entry.getRegistrationId()).orElse(null);
        Horse horse = registration == null
                ? null
                : horseRepository.findById(registration.getHorseId()).orElse(null);
        User bettor = userRepository.findById(ticket.getUserId()).orElse(null);
        User owner = registration == null || registration.getOwnerId() == null
                ? null
                : userRepository.findById(registration.getOwnerId()).orElse(null);
        User jockey = registration == null || registration.getJockeyId() == null
                ? null
                : userRepository.findById(registration.getJockeyId()).orElse(null);

        return AdminBetTicketResponse.builder()
                .betTicketId(ticket.getBetTicketId())
                .betEventId(ticket.getBetEventId())
                .bettorId(bettor != null ? bettor.getUserID() : ticket.getUserId())
                .bettorName(displayName(bettor))
                .bettorEmail(bettor != null ? bettor.getEmail() : null)
                .raceId(ticket.getRaceId())
                .raceName(race.getRaceName())
                .raceEntryId(ticket.getRaceEntryId())
                .startingStall(entry != null ? entry.getStartingStall() : null)
                .horseId(horse != null ? horse.getHorseId() : null)
                .horseName(horse != null ? horse.getHorseName() : null)
                .ownerId(owner != null ? owner.getUserID() : registration != null ? registration.getOwnerId() : null)
                .ownerName(displayName(owner))
                .jockeyId(jockey != null ? jockey.getUserID() : registration != null ? registration.getJockeyId() : null)
                .jockeyName(displayName(jockey))
                .stake(ticket.getStake())
                .estimatedOddsAtBet(ticket.getEstimatedOddsAtBet())
                .finalOdds(ticket.getFinalOdds())
                .payoutAmount(ticket.getPayoutAmount())
                .netProfit(netProfit(ticket))
                .status(ticket.getStatus())
                .refundReason(ticket.getRefundReason())
                .placedAt(ticket.getPlacedAt())
                .settledAt(ticket.getSettledAt())
                .voidedAt(ticket.getVoidedAt())
                .build();
    }

    private AdminBetSettlementSummaryResponse toAdminSettlementSummaryResponse(BetSettlement settlement) {
        BetEvent event = getEventOrThrow(settlement.getBetEventId());
        Race race = getRace(event.getRaceId());
        BetProduct product = getProduct(event.getBetProductId());
        User settledBy = userRepository.findById(settlement.getSettledBy()).orElse(null);

        return AdminBetSettlementSummaryResponse.builder()
                .betSettlementId(settlement.getBetSettlementId())
                .betEventId(settlement.getBetEventId())
                .raceId(race.getRaceId())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .raceStartTime(race.getRaceStartTime())
                .betProductId(product.getBetProductId())
                .productCode(product.getCode())
                .productName(product.getName())
                .eventStatus(event.getStatus())
                .totalStake(settlement.getTotalStake())
                .winningStake(settlement.getWinningStake())
                .losingStake(settlement.getLosingStake())
                .operatorFee(settlement.getOperatorFee())
                .payoutPool(settlement.getPayoutPool())
                .rawOdds(settlement.getRawOdds())
                .minimumOdds(settlement.getMinimumOdds())
                .finalOdds(settlement.getFinalOdds())
                .totalPayout(settlement.getTotalPayout())
                .subsidyAmount(settlement.getSubsidyAmount())
                .outcome(settlement.getOutcome())
                .voidReason(settlement.getVoidReason())
                .settledBy(settlement.getSettledBy())
                .settledByName(displayName(settledBy))
                .settledAt(settlement.getSettledAt())
                .build();
    }

    private BetSettlementResponse toSettlementResponse(BetSettlement settlement) {
        return BetSettlementResponse.builder()
                .betSettlementId(settlement.getBetSettlementId())
                .betEventId(settlement.getBetEventId())
                .totalStake(settlement.getTotalStake())
                .winningStake(settlement.getWinningStake())
                .losingStake(settlement.getLosingStake())
                .operatorFee(settlement.getOperatorFee())
                .payoutPool(settlement.getPayoutPool())
                .grossPool(settlement.getGrossPool())
                .netPool(settlement.getNetPool())
                .rawOdds(settlement.getRawOdds())
                .minimumOdds(settlement.getMinimumOdds())
                .finalOdds(settlement.getFinalOdds())
                .totalPayout(settlement.getTotalPayout())
                .subsidyAmount(settlement.getSubsidyAmount())
                .roundingAdjustment(settlement.getRoundingAdjustment())
                .outcome(settlement.getOutcome())
                .voidReason(settlement.getVoidReason())
                .settledBy(settlement.getSettledBy())
                .settledAt(settlement.getSettledAt())
                .build();
    }

    private String displayName(User user) {
        if (user == null) {
            return null;
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }
        return user.getEmail();
    }

    private BetProductResponse toProductResponse(BetProduct product) {
        return BetProductResponse.builder()
                .betProductId(product.getBetProductId())
                .code(product.getCode())
                .name(product.getName())
                .description(product.getDescription())
                .minStake(product.getMinStake())
                .maxDailyStake(product.getMaxDailyStake())
                .operatorFeeRate(product.getOperatorFeeRate())
                .minimumOdds(normalizeMinimumOdds(product.getMinimumOdds()))
                .active(product.getActive())
                .build();
    }

    private BigDecimal calculateEstimatedOdds(BetEvent event, Integer raceEntryId, BigDecimal extraStake) {
        BigDecimal totalStake = valueOrZero(betTicketRepository.sumStakeByEvent(
                event.getBetEventId(),
                ACTIVE_TICKET_STATUSES
        )).add(valueOrZero(extraStake));
        BigDecimal selectedStake = valueOrZero(betTicketRepository.sumStakeByEventAndRaceEntry(
                event.getBetEventId(),
                raceEntryId,
                ACTIVE_TICKET_STATUSES
        )).add(valueOrZero(extraStake));
        if (selectedStake.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        BigDecimal payoutPool = totalStake.subtract(totalStake.multiply(event.getOperatorFeeRate()));
        BigDecimal rawOdds = payoutPool.divide(selectedStake, 4, RoundingMode.HALF_UP);
        return rawOdds.max(normalizeMinimumOdds(getProduct(event.getBetProductId()).getMinimumOdds()));
    }

    private void saveWalletTransaction(
            Wallet wallet,
            String type,
            BigDecimal amount,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter,
            BigDecimal lockedBefore,
            BigDecimal lockedAfter,
            String referenceType,
            Integer referenceId,
            String description
    ) {
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(wallet.getWalletId());
        transaction.setUserId(wallet.getUserId());
        transaction.setType(type);
        transaction.setAmount(amount.setScale(2, RoundingMode.HALF_UP));
        transaction.setBalanceBefore(balanceBefore.setScale(2, RoundingMode.HALF_UP));
        transaction.setBalanceAfter(balanceAfter.setScale(2, RoundingMode.HALF_UP));
        transaction.setLockedBefore(lockedBefore.setScale(2, RoundingMode.HALF_UP));
        transaction.setLockedAfter(lockedAfter.setScale(2, RoundingMode.HALF_UP));
        transaction.setReferenceType(referenceType);
        transaction.setReferenceId(referenceId);
        transaction.setDescription(description);
        walletTransactionRepository.save(transaction);
    }

    private User getAdmin(String email) {
        User user = getUser(email);
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!"ADMIN".equalsIgnoreCase(roleName)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only administrators can manage betting.");
        }
        return user;
    }

    private User getUser(String email) {
        // Query user theo email lấy từ JWT.
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user does not exist."));
    }

    private Race getRace(Integer raceId) {
        return raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race does not exist."));
    }

    private BetProduct getActiveProduct(Integer productId) {
        BetProduct product = betProductRepository.findById(productId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet product does not exist."));
        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bet product is inactive.");
        }
        return product;
    }

    private BetEvent getEventOrThrow(Integer eventId) {
        return betEventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet event does not exist."));
    }

    private BetProduct getProduct(Integer productId) {
        return betProductRepository.findById(productId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet product does not exist."));
    }

    private BigDecimal normalizeMoney(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Amount must be greater than 0.");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeRate(BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(new BigDecimal("0.5000")) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Operator fee rate must be from 0 to 0.5.");
        }
        return rate.setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeMinimumOdds(BigDecimal odds) {
        BigDecimal value = odds == null ? DEFAULT_MINIMUM_ODDS : odds;
        if (value.compareTo(DEFAULT_MINIMUM_ODDS) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Minimum odds cannot be lower than 1.05.");
        }
        return value.setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal netProfit(BetTicket ticket) {
        if (ticket.getPayoutAmount() == null || ticket.getStake() == null) {
            return null;
        }
        if (BetTicketStatus.REFUNDED.equals(ticket.getStatus())
                || BetTicketStatus.VOID.equals(ticket.getStatus())) {
            return BigDecimal.ZERO.setScale(2);
        }
        return ticket.getPayoutAmount().subtract(ticket.getStake())
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal max(BigDecimal left, BigDecimal right) {
        return left.compareTo(right) >= 0 ? left : right;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
