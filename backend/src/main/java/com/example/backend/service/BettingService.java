package com.example.backend.service;

import com.example.backend.constant.BetEventStatus;
import com.example.backend.constant.BetProductCode;
import com.example.backend.constant.BetTicketStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.WalletReferenceType;
import com.example.backend.constant.WalletStatus;
import com.example.backend.constant.WalletTransactionType;
import com.example.backend.dto.request.CreateBetEventRequest;
import com.example.backend.dto.request.PlaceBetRequest;
import com.example.backend.dto.request.UpdateBetProductRequest;
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
        product.setActive(request.getActive());

        return toProductResponse(betProductRepository.save(product));
    }

    @Transactional(readOnly = true)
    public List<BetEventResponse> getOpenEvents() {
        return betEventRepository.findByStatusInOrderByOpenAtAsc(
                        List.of(BetEventStatus.OPEN, BetEventStatus.CLOSED)
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
    public BetEventResponse getEvent(Integer eventId) {
        BetEvent event = getEventOrThrow(eventId);
        return toEventResponse(event, true);
    }

    @Transactional
    public BetEventResponse createEvent(CreateBetEventRequest request, String adminEmail) {
        User admin = getAdmin(adminEmail);
        Race race = raceRepository.findById(request.getRaceId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race does not exist."));
        BetProduct product = betProductRepository.findById(request.getBetProductId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet product does not exist."));
        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bet product is inactive.");
        }
        if (betEventRepository.existsByRaceIdAndBetProductId(race.getRaceId(), product.getBetProductId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bet event already exists for this race and product.");
        }
        validateEventWindow(race, request.getOpenAt(), request.getCloseAt());

        BetEvent event = new BetEvent();
        event.setRaceId(race.getRaceId());
        event.setBetProductId(product.getBetProductId());
        event.setStatus(BetEventStatus.DRAFT);
        event.setOpenAt(request.getOpenAt());
        event.setCloseAt(request.getCloseAt());
        event.setOperatorFeeRate(request.getOperatorFeeRate() != null
                ? normalizeRate(request.getOperatorFeeRate())
                : normalizeRate(product.getOperatorFeeRate()));
        event.setCreatedBy(admin.getUserID());

        return toEventResponse(betEventRepository.save(event), true);
    }

    @Transactional
    public BetEventResponse openEvent(Integer eventId) {
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
        BetEvent event = betEventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet event does not exist."));
        if (!BetEventStatus.OPEN.equals(event.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only open betting events can be closed.");
        }
        event.setStatus(BetEventStatus.CLOSED);
        return toEventResponse(betEventRepository.save(event), true);
    }

    @Transactional
    public BetTicketResponse placeBet(Integer eventId, PlaceBetRequest request, String email) {
        User user = getUser(email);
        validatePlayerRole(user);
        UserVerification verification = validateBettingKyc(user);
        validateAge(verification);

        BetEvent event = betEventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bet event does not exist."));
        BetProduct product = getProduct(event.getBetProductId());
        Race race = getRace(event.getRaceId());
        validateEventIsBettable(event, race);

        RaceEntry raceEntry = raceEntryRepository.findById(request.getRaceEntryId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race entry does not exist."));
        if (!event.getRaceId().equals(raceEntry.getRaceId())
                || !RaceEntryStatus.ASSIGNED.equals(raceEntry.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Race entry is not available for this betting event.");
        }

        Registration registration = registrationRepository.findById(raceEntry.getRegistrationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race registration does not exist."));
        if (user.getUserID().equals(registration.getOwnerId())
                || user.getUserID().equals(registration.getJockeyId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Race participants cannot bet on their own race entry.");
        }

        BigDecimal stake = normalizeMoney(request.getStake());
        if (stake.compareTo(max(product.getMinStake(), DEFAULT_MIN_STAKE)) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Stake is lower than the product minimum stake.");
        }
        validateDailyLimit(user.getUserID(), product, stake);

        Wallet wallet = walletRepository.findByUserIdForUpdate(user.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Wallet is not opened."));
        ensureWalletActive(wallet);
        BigDecimal available = valueOrZero(wallet.getBalance()).subtract(valueOrZero(wallet.getLockedBalance()));
        if (available.compareTo(stake) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Wallet balance is not enough for this bet.");
        }

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

        for (BetTicket ticket : tickets) {
            settleTicket(ticket, winningEntryIds.contains(ticket.getRaceEntryId()), winningStake, payoutPool);
        }

        BetSettlement settlement = new BetSettlement();
        settlement.setBetEventId(eventId);
        settlement.setTotalStake(totalStake.setScale(2, RoundingMode.HALF_UP));
        settlement.setWinningStake(winningStake.setScale(2, RoundingMode.HALF_UP));
        settlement.setLosingStake(losingStake.setScale(2, RoundingMode.HALF_UP));
        settlement.setOperatorFee(operatorFee);
        settlement.setPayoutPool(payoutPool.setScale(2, RoundingMode.HALF_UP));
        settlement.setSettledBy(settledByUserId);
        settlement.setSettledAt(LocalDateTime.now());
        BetSettlement savedSettlement = betSettlementRepository.save(settlement);
        fundAccountingService.recordBettingOperatorFee(savedSettlement);

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
            BigDecimal winningStake,
            BigDecimal payoutPool
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

        BigDecimal payout = BigDecimal.ZERO;
        if (winningStake.compareTo(BigDecimal.ZERO) > 0) {
            payout = stake.divide(winningStake, 8, RoundingMode.HALF_UP)
                    .multiply(payoutPool)
                    .setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal balanceAfter = balanceBefore.add(payout.subtract(stake));
        BigDecimal odds = payout.divide(stake, 4, RoundingMode.HALF_UP);

        wallet.setBalance(balanceAfter);
        wallet.setLockedBalance(lockedAfter);
        walletRepository.save(wallet);

        ticket.setStatus(BetTicketStatus.WON);
        ticket.setFinalOdds(odds);
        ticket.setPayoutAmount(payout);
        ticket.setSettledAt(LocalDateTime.now());
        betTicketRepository.save(ticket);

        saveWalletTransaction(wallet, WalletTransactionType.BET_WIN, payout,
                balanceBefore, balanceAfter, lockedBefore, lockedAfter,
                WalletReferenceType.BET_TICKET, ticket.getBetTicketId(), "Settle winning betting ticket");
    }

    private Set<Integer> getWinningEntryIds(String productCode, List<RaceResult> results) {
        String normalized = productCode != null ? productCode.toUpperCase() : "";
        if (!BetProductCode.WIN.equals(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported bet product.");
        }
        return results.stream()
                .filter(result -> Integer.valueOf(1).equals(result.getFinishPosition()))
                .map(RaceResult::getRaceEntryId)
                .collect(Collectors.toSet());
    }

    private void validateEventCanOpen(BetEvent event) {
        Race race = getRace(event.getRaceId());
        validateEventWindow(race, event.getOpenAt(), event.getCloseAt());
        if (raceEntryRepository.countByRaceIdAndStatus(event.getRaceId(), RaceEntryStatus.ASSIGNED) < 2) {
            throw new ApiException(HttpStatus.CONFLICT, "At least two race entries are required to open betting.");
        }
    }

    private void validateEventWindow(Race race, LocalDateTime openAt, LocalDateTime closeAt) {
        if (!openAt.isBefore(closeAt)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Betting open time must be before close time.");
        }
        if (!closeAt.isBefore(race.getRaceStartTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Betting must close before race start time.");
        }
        if (closeAt.isAfter(race.getRaceStartTime().minusMinutes(1))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Betting must close at least 1 minute before race start.");
        }
        if (openAt.isBefore(race.getRaceStartTime().minusHours(12))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Betting cannot open more than 12 hours before race start.");
        }
    }

    private void validateEventIsBettable(BetEvent event, Race race) {
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

    private void validateDailyLimit(Integer userId, BetProduct product, BigDecimal stake) {
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
        if (verification.getDateOfBirth() == null
                || Period.between(verification.getDateOfBirth(), LocalDate.now()).getYears() < 21) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Player must be at least 21 years old to bet.");
        }
    }

    private void validatePlayerRole(User user) {
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        String accountType = user.getAccountType() == null ? roleName : user.getAccountType();
        if (!"SPECTATOR".equalsIgnoreCase(roleName)
                || !"SPECTATOR".equalsIgnoreCase(accountType)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only spectators can place bets.");
        }
    }

    private void ensureWalletActive(Wallet wallet) {
        if (!WalletStatus.ACTIVE.equals(wallet.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Wallet is not active.");
        }
    }

    private BetEventResponse toEventResponse(BetEvent event, boolean includeEntries) {
        Race race = getRace(event.getRaceId());
        BetProduct product = getProduct(event.getBetProductId());
        BigDecimal totalStake = betTicketRepository.sumStakeByEvent(event.getBetEventId(), ACTIVE_TICKET_STATUSES);
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
                .totalStake(valueOrZero(totalStake))
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
                .status(ticket.getStatus())
                .placedAt(ticket.getPlacedAt())
                .settledAt(ticket.getSettledAt())
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
                .settledBy(settlement.getSettledBy())
                .settledAt(settlement.getSettledAt())
                .build();
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
        return payoutPool.divide(selectedStake, 4, RoundingMode.HALF_UP);
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
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user does not exist."));
    }

    private Race getRace(Integer raceId) {
        return raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race does not exist."));
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
