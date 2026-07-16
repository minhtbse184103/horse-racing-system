USE `horse_racing_system`;

CREATE TABLE IF NOT EXISTS `TournamentFund` (
  `tournamentID` int PRIMARY KEY,
  `collectedAmount` decimal(14,2) NOT NULL DEFAULT 0,
  `paidPrizeAmount` decimal(14,2) NOT NULL DEFAULT 0,
  `availableBalance` decimal(14,2) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  CONSTRAINT `chk_tournament_fund_amounts`
    CHECK (`collectedAmount` >= 0 AND `paidPrizeAmount` >= 0 AND `availableBalance` >= 0
      AND `paidPrizeAmount` + `availableBalance` = `collectedAmount`),
  CONSTRAINT `fk_tournament_fund_tournament`
    FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`)
);

CREATE TABLE IF NOT EXISTS `SystemFund` (
  `systemFundID` int PRIMARY KEY,
  `balance` decimal(14,2) NOT NULL DEFAULT 0,
  `bettingFeeRevenue` decimal(14,2) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  CONSTRAINT `chk_system_fund_amounts`
    CHECK (`balance` >= 0 AND `bettingFeeRevenue` >= 0)
);

CREATE TABLE IF NOT EXISTS `FundTransaction` (
  `fundTransactionID` bigint PRIMARY KEY AUTO_INCREMENT,
  `fundKey` varchar(80) NOT NULL,
  `tournamentID` int,
  `transactionType` varchar(50) NOT NULL,
  `direction` varchar(10) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `balanceBefore` decimal(14,2) NOT NULL,
  `balanceAfter` decimal(14,2) NOT NULL,
  `referenceType` varchar(50) NOT NULL,
  `referenceID` int NOT NULL,
  `description` varchar(500),
  `createdAt` datetime NOT NULL,
  CONSTRAINT `FundTransaction_unique_reference`
    UNIQUE (`fundKey`, `transactionType`, `referenceType`, `referenceID`),
  CONSTRAINT `chk_fund_transaction_type`
    CHECK (`transactionType` IN ('REGISTRATION_FEE', 'PRIZE_PAYOUT', 'BETTING_OPERATOR_FEE')),
  CONSTRAINT `chk_fund_transaction_direction`
    CHECK (`direction` IN ('CREDIT', 'DEBIT')),
  CONSTRAINT `chk_fund_transaction_amount`
    CHECK (`amount` > 0 AND `balanceBefore` >= 0 AND `balanceAfter` >= 0),
  CONSTRAINT `fk_fund_transaction_tournament`
    FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`)
);

INSERT INTO `SystemFund`
  (`systemFundID`, `balance`, `bettingFeeRevenue`, `createdAt`, `updatedAt`)
SELECT 1, COALESCE(SUM(`operatorFee`), 0), COALESCE(SUM(`operatorFee`), 0), NOW(), NOW()
FROM `BetSettlement`
ON DUPLICATE KEY UPDATE
  `balance` = IF(`bettingFeeRevenue` = 0, VALUES(`balance`), `balance`),
  `bettingFeeRevenue` = IF(`bettingFeeRevenue` = 0, VALUES(`bettingFeeRevenue`), `bettingFeeRevenue`),
  `updatedAt` = NOW();

INSERT INTO `TournamentFund`
  (`tournamentID`, `collectedAmount`, `paidPrizeAmount`, `availableBalance`, `createdAt`, `updatedAt`)
SELECT r.`tournamentID`, SUM(p.`amount`), 0, SUM(p.`amount`), NOW(), NOW()
FROM `PaymentTransaction` p
JOIN `Registration` r ON r.`registrationID` = p.`registrationID`
WHERE p.`purpose` = 'REGISTRATION_FEE' AND p.`status` = 'SUCCESS'
GROUP BY r.`tournamentID`
ON DUPLICATE KEY UPDATE
  `availableBalance` = IF(`collectedAmount` = 0 AND `paidPrizeAmount` = 0,
    VALUES(`availableBalance`), `availableBalance`),
  `collectedAmount` = IF(`collectedAmount` = 0 AND `paidPrizeAmount` = 0,
    VALUES(`collectedAmount`), `collectedAmount`),
  `updatedAt` = NOW();
