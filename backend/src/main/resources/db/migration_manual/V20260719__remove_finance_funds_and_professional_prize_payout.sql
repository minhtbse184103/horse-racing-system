USE `horse_racing_system`;

-- One-time migration for databases created from an older team_schema.sql.
-- The application no longer maintains internal Tournament/System funds or
-- distributes RacePrize amounts into Owner/Jockey wallets.

DROP TABLE IF EXISTS `PrizeDistribution`;
DROP TABLE IF EXISTS `FundTransaction`;
DROP TABLE IF EXISTS `SystemFund`;
DROP TABLE IF EXISTS `TournamentFund`;

ALTER TABLE `RacePrize`
  DROP CHECK `chk_race_prize_owner_percent`,
  DROP CHECK `chk_race_prize_jockey_percent`,
  DROP CHECK `chk_race_prize_split_total`,
  DROP COLUMN `ownerPercent`,
  DROP COLUMN `jockeyPercent`;

-- Future approvals provision the wallet transactionally in application code.
-- This backfill covers professionals approved before that code was deployed.
INSERT INTO `Wallet`
  (`userID`, `balance`, `lockedBalance`, `currency`, `status`, `createdAt`, `updatedAt`)
SELECT
  u.`userID`, 0.00, 0.00, 'VND', 'ACTIVE', NOW(), NOW()
FROM `Users` u
JOIN `Roles` r ON r.`roleID` = u.`roleID`
LEFT JOIN `Wallet` w ON w.`userID` = u.`userID`
WHERE w.`walletID` IS NULL
  AND UPPER(TRIM(u.`status`)) = 'ACTIVE'
  AND UPPER(TRIM(r.`roleName`)) IN ('OWNER', 'JOCKEY')
  AND UPPER(TRIM(u.`accountType`)) = UPPER(TRIM(r.`roleName`));

-- Historical WalletTransaction rows are intentionally retained. No current
-- application flow creates PRIZE_PAYOUT transactions after this migration.
