package com.example.backend.service;

import com.example.backend.constant.PaymentPurpose;
import com.example.backend.dto.response.AdminMoneyTransactionResponse;
import com.example.backend.entity.BetEvent;
import com.example.backend.entity.BetSettlement;
import com.example.backend.entity.FundTransaction;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.entity.Race;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.entity.WalletTransaction;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.BetEventRepository;
import com.example.backend.repository.BetSettlementRepository;
import com.example.backend.repository.FundTransactionRepository;
import com.example.backend.repository.PaymentTransactionRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminMoneyTransactionService {

    private static final String ACTIVE = "ACTIVE";
    private static final String ADMIN = "ADMIN";
    private static final String VND = "VND";
    private static final int DEFAULT_LIMIT = 200;
    private static final int MAX_LIMIT = 500;

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final FundTransactionRepository fundTransactionRepository;
    private final BetSettlementRepository betSettlementRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;
    private final RaceRepository raceRepository;
    private final BetEventRepository betEventRepository;

    @Transactional(readOnly = true)
    public List<AdminMoneyTransactionResponse> getTransactions(
            String authenticatedEmail,
            String source,
            String type,
            String status,
            LocalDateTime from,
            LocalDateTime to,
            Integer userId,
            Integer tournamentId,
            Integer limit
    ) {
        validateActiveAdmin(authenticatedEmail);

        Context context = loadContext();
        List<AdminMoneyTransactionResponse> transactions = new ArrayList<>();
        paymentTransactionRepository.findAllByOrderByCreatedAtDesc()
                .forEach(payment -> transactions.add(toPaymentTransaction(payment, context)));
        walletTransactionRepository.findAllByOrderByCreatedAtDesc()
                .forEach(walletTransaction -> transactions.add(toWalletTransaction(walletTransaction, context)));
        fundTransactionRepository.findAllByOrderByCreatedAtDesc()
                .forEach(fundTransaction -> transactions.add(toFundTransaction(fundTransaction, context)));
        betSettlementRepository.findAllByOrderBySettledAtDesc()
                .forEach(settlement -> transactions.add(toBetSettlement(settlement, context)));

        int effectiveLimit = normalizeLimit(limit);
        return transactions.stream()
                .filter(transaction -> matches(source, transaction.getSource()))
                .filter(transaction -> matches(type, transaction.getTransactionType()))
                .filter(transaction -> matches(status, transaction.getStatus()))
                .filter(transaction -> userId == null || Objects.equals(userId, transaction.getUserId()))
                .filter(transaction -> tournamentId == null || Objects.equals(tournamentId, transaction.getTournamentId()))
                .filter(transaction -> from == null || !safeCreatedAt(transaction).isBefore(from))
                .filter(transaction -> to == null || !safeCreatedAt(transaction).isAfter(to))
                .sorted(Comparator.comparing(AdminMoneyTransactionService::safeCreatedAt).reversed())
                .limit(effectiveLimit)
                .toList();
    }

    private AdminMoneyTransactionResponse toPaymentTransaction(PaymentTransaction payment, Context context) {
        Registration registration = payment.getRegistrationId() == null
                ? null
                : context.registrations.get(payment.getRegistrationId());
        Integer tournamentId = registration != null ? registration.getTournamentId() : null;
        Tournament tournament = tournamentId == null ? null : context.tournaments.get(tournamentId);
        User user = context.users.get(payment.getUserId());
        String direction = PaymentPurpose.REGISTRATION_FEE.equals(payment.getPurpose())
                || PaymentPurpose.WALLET_DEPOSIT.equals(payment.getPurpose())
                ? "CREDIT"
                : null;

        return AdminMoneyTransactionResponse.builder()
                .id("PAYMENT:" + payment.getPaymentTransactionId())
                .source("PAYMENT")
                .transactionType(payment.getPurpose())
                .direction(direction)
                .amount(money(payment.getAmount()))
                .currency(valueOrDefault(payment.getCurrency(), VND))
                .status(payment.getStatus())
                .userId(payment.getUserId())
                .username(displayUser(user))
                .tournamentId(tournamentId)
                .tournamentName(tournament != null ? tournament.getTournamentName() : null)
                .referenceType("PAYMENT_TRANSACTION")
                .referenceId(payment.getPaymentTransactionId())
                .description(payment.getProvider() + " " + valueOrDefault(payment.getPurpose(), "payment"))
                .createdAt(payment.getPaidAt() != null ? payment.getPaidAt() : payment.getCreatedAt())
                .build();
    }

    private AdminMoneyTransactionResponse toWalletTransaction(WalletTransaction transaction, Context context) {
        User user = context.users.get(transaction.getUserId());
        return AdminMoneyTransactionResponse.builder()
                .id("WALLET:" + transaction.getWalletTransactionId())
                .source("WALLET")
                .transactionType(transaction.getType())
                .direction(walletDirection(transaction.getType()))
                .amount(money(transaction.getAmount()))
                .currency(VND)
                .status("RECORDED")
                .userId(transaction.getUserId())
                .username(displayUser(user))
                .referenceType(transaction.getReferenceType())
                .referenceId(transaction.getReferenceId())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private AdminMoneyTransactionResponse toFundTransaction(FundTransaction transaction, Context context) {
        Tournament tournament = transaction.getTournamentId() == null
                ? null
                : context.tournaments.get(transaction.getTournamentId());
        Race race = resolveRaceFromFundTransaction(transaction, context).orElse(null);
        return AdminMoneyTransactionResponse.builder()
                .id("FUND:" + transaction.getFundTransactionId())
                .source("FUND")
                .transactionType(transaction.getTransactionType())
                .direction(transaction.getDirection())
                .amount(money(transaction.getAmount()))
                .currency(VND)
                .status("RECORDED")
                .tournamentId(transaction.getTournamentId())
                .tournamentName(tournament != null ? tournament.getTournamentName() : null)
                .raceId(race != null ? race.getRaceId() : null)
                .raceName(race != null ? race.getRaceName() : null)
                .referenceType(transaction.getReferenceType())
                .referenceId(transaction.getReferenceId())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private AdminMoneyTransactionResponse toBetSettlement(BetSettlement settlement, Context context) {
        BetEvent event = context.betEvents.get(settlement.getBetEventId());
        Race race = event == null ? null : context.races.get(event.getRaceId());
        Tournament tournament = race == null ? null : context.tournaments.get(race.getTournamentId());
        User settledBy = context.users.get(settlement.getSettledBy());
        return AdminMoneyTransactionResponse.builder()
                .id("BET_SETTLEMENT:" + settlement.getBetSettlementId())
                .source("BET_SETTLEMENT")
                .transactionType("BET_SETTLEMENT")
                .direction("SETTLED")
                .amount(money(settlement.getTotalStake()))
                .currency(VND)
                .status("SETTLED")
                .userId(settlement.getSettledBy())
                .username(displayUser(settledBy))
                .tournamentId(tournament != null ? tournament.getTournamentId() : null)
                .tournamentName(tournament != null ? tournament.getTournamentName() : null)
                .raceId(race != null ? race.getRaceId() : null)
                .raceName(race != null ? race.getRaceName() : null)
                .referenceType("BET_SETTLEMENT")
                .referenceId(settlement.getBetSettlementId())
                .description("totalStake=" + money(settlement.getTotalStake())
                        + ", payoutPool=" + money(settlement.getPayoutPool())
                        + ", operatorFee=" + money(settlement.getOperatorFee()))
                .createdAt(settlement.getSettledAt())
                .build();
    }

    private Optional<Race> resolveRaceFromFundTransaction(FundTransaction transaction, Context context) {
        if (!"BET_SETTLEMENT".equals(transaction.getReferenceType())) {
            return Optional.empty();
        }
        BetSettlement settlement = context.betSettlementsById.get(transaction.getReferenceId());
        if (settlement == null) {
            return Optional.empty();
        }
        BetEvent event = context.betEvents.get(settlement.getBetEventId());
        return event == null ? Optional.empty() : Optional.ofNullable(context.races.get(event.getRaceId()));
    }

    private Context loadContext() {
        Context context = new Context();
        userRepository.findAll().forEach(user -> context.users.put(user.getUserID(), user));
        registrationRepository.findAll().forEach(registration ->
                context.registrations.put(registration.getRegistrationId(), registration));
        tournamentRepository.findAll().forEach(tournament ->
                context.tournaments.put(tournament.getTournamentId(), tournament));
        raceRepository.findAll().forEach(race -> context.races.put(race.getRaceId(), race));
        betEventRepository.findAll().forEach(event -> context.betEvents.put(event.getBetEventId(), event));
        betSettlementRepository.findAll().forEach(settlement ->
                context.betSettlementsById.put(settlement.getBetSettlementId(), settlement));
        return context;
    }

    private void validateActiveAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user does not exist."));
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!ADMIN.equalsIgnoreCase(roleName) || !ACTIVE.equalsIgnoreCase(user.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only active administrators can view money transactions.");
        }
    }

    private static boolean matches(String expected, String actual) {
        return expected == null
                || expected.isBlank()
                || "ALL".equalsIgnoreCase(expected)
                || expected.equalsIgnoreCase(actual);
    }

    private static LocalDateTime safeCreatedAt(AdminMoneyTransactionResponse transaction) {
        return transaction.getCreatedAt() != null ? transaction.getCreatedAt() : LocalDateTime.MIN;
    }

    private static int normalizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private static BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String walletDirection(String type) {
        if (type == null) {
            return null;
        }
        return switch (type) {
            case "DEPOSIT", "BET_WIN", "BET_REFUND", "PRIZE_PAYOUT" -> "CREDIT";
            case "BET_LOCK" -> "LOCK";
            case "BET_LOST" -> "DEBIT";
            default -> null;
        };
    }

    private static String displayUser(User user) {
        if (user == null) {
            return null;
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }
        return user.getEmail();
    }

    private static class Context {
        private final Map<Integer, User> users = new HashMap<>();
        private final Map<Integer, Registration> registrations = new HashMap<>();
        private final Map<Integer, Tournament> tournaments = new HashMap<>();
        private final Map<Integer, Race> races = new HashMap<>();
        private final Map<Integer, BetEvent> betEvents = new HashMap<>();
        private final Map<Integer, BetSettlement> betSettlementsById = new HashMap<>();
    }
}
