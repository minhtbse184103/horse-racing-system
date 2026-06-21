DROP DATABASE IF EXISTS horse_racing_system;

CREATE DATABASE horse_racing_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE horse_racing_system;

CREATE TABLE `Roles` (
  `roleID` int PRIMARY KEY AUTO_INCREMENT,
  `roleName` varchar(255) UNIQUE NOT NULL
);

CREATE TABLE `Users` (
  `userID` int PRIMARY KEY AUTO_INCREMENT,
  `roleID` int NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) UNIQUE,
  `status` varchar(50),
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `Horse` (
  `horseID` int PRIMARY KEY AUTO_INCREMENT,
  `ownerID` int NOT NULL,
  `horseName` varchar(255) UNIQUE NOT NULL,
  `breed` varchar(255),
  `gender` varchar(50),
  `color` varchar(255),
  `dayOfBirth` date,
  `weight` decimal(10,2) NOT NULL,
  `healthCertExpiry` date,
  `status` varchar(50),
  `rejectionReason` varchar(500),
  `img_url` text,
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `JockeyProfile` (
  `jockeyID` int PRIMARY KEY,
  `licenseNo` varchar(255) UNIQUE NOT NULL,
  `weight` decimal(10,2) NOT NULL,
  `ranking` varchar(255),
  `status` varchar(50),
  `rejectionReason` varchar(500),
  `img_url` text,
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `Tournament` (
  `tournamentID` int PRIMARY KEY AUTO_INCREMENT,
  `tournamentName` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `venueImageUrl` varchar(500),
  `description` text,
  `registrationOpenAt` datetime NOT NULL,
  `registrationCloseAt` datetime NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `maxRegistrations` int NOT NULL,
  `entryFee` decimal(12,2) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'OPEN_FOR_REGISTRATION',
  `createdBy` int NOT NULL,
  `createdAt` datetime,
  `updatedAt` datetime,
  CONSTRAINT `chk_tournament_dates`
    CHECK (`startDate` <= `endDate`),
  CONSTRAINT `chk_tournament_registration_window`
    CHECK (`registrationOpenAt` < `registrationCloseAt`),
  CONSTRAINT `chk_tournament_max_registrations`
    CHECK (`maxRegistrations` > 0),
  CONSTRAINT `chk_tournament_entry_fee`
    CHECK (`entryFee` >= 0),
  CONSTRAINT `chk_tournament_status`
    CHECK (`status` IN (
      'OPEN_FOR_REGISTRATION',
      'REGISTRATION_CLOSED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    ))
);

CREATE TABLE `TournamentCondition` (
  `conditionID` int PRIMARY KEY AUTO_INCREMENT,
  `tournamentID` int NOT NULL,
  `conditionType` varchar(50) NOT NULL,
  `operator` varchar(20) NOT NULL,
  `minValue` decimal(10,2),
  `maxValue` decimal(10,2),
  `value` varchar(50),
  CONSTRAINT `chk_tournament_condition_type`
    CHECK (`conditionType` IN ('AGE', 'GENDER', 'WEIGHT')),
  CONSTRAINT `chk_tournament_condition_operator`
    CHECK (
      (`conditionType` = 'GENDER'
        AND `operator` = 'EQ'
        AND `value` IS NOT NULL
        AND `minValue` IS NULL
        AND `maxValue` IS NULL)
      OR
      (`conditionType` IN ('AGE', 'WEIGHT')
        AND (
          (`operator` IN ('EQ', 'GT', 'GTE', 'LT', 'LTE')
            AND `value` IS NOT NULL
            AND `minValue` IS NULL
            AND `maxValue` IS NULL)
          OR
          (`operator` = 'BETWEEN'
            AND `value` IS NULL
            AND `minValue` IS NOT NULL
            AND `maxValue` IS NOT NULL
            AND `minValue` <= `maxValue`)
        ))
    )
);

CREATE TABLE `Race` (
  `raceID` int PRIMARY KEY AUTO_INCREMENT,
  `tournamentID` int NOT NULL,
  `raceName` varchar(255) NOT NULL,
  `trackName` varchar(255) NOT NULL,
  `raceStartTime` datetime NOT NULL,
  `raceEndTime` datetime,
  `distance` int NOT NULL,
  `maxRunners` int NOT NULL,
  `raceOrder` int,
  `status` varchar(50) NOT NULL DEFAULT 'OPEN_FOR_REGISTRATION',
  `createdAt` datetime,
  `updatedAt` datetime,
  CONSTRAINT `chk_race_time`
    CHECK (`raceEndTime` IS NULL OR `raceStartTime` < `raceEndTime`),
  CONSTRAINT `chk_race_distance`
    CHECK (`distance` > 0),
  CONSTRAINT `chk_race_max_runners`
    CHECK (`maxRunners` > 0),
  CONSTRAINT `chk_race_order`
    CHECK (`raceOrder` IS NULL OR `raceOrder` > 0),
  CONSTRAINT `chk_race_status`
    CHECK (`status` IN (
      'OPEN_FOR_REGISTRATION',
      'REGISTRATION_CLOSED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    ))
);

CREATE TABLE `RacePrize` (
  `racePrizeID` int PRIMARY KEY AUTO_INCREMENT,
  `raceID` int NOT NULL,
  `rankPosition` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `ownerPercent` decimal(5,2) NOT NULL,
  `jockeyPercent` decimal(5,2) NOT NULL,
  CONSTRAINT `chk_race_prize_rank`
    CHECK (`rankPosition` > 0),
  CONSTRAINT `chk_race_prize_amount`
    CHECK (`amount` > 0),
  CONSTRAINT `chk_race_prize_owner_percent`
    CHECK (`ownerPercent` >= 0),
  CONSTRAINT `chk_race_prize_jockey_percent`
    CHECK (`jockeyPercent` >= 0),
  CONSTRAINT `chk_race_prize_split_total`
    CHECK (`ownerPercent` + `jockeyPercent` = 100)
);

CREATE TABLE `Registration` (
  `registrationID` int PRIMARY KEY AUTO_INCREMENT,
  `tournamentID` int NOT NULL,
  `horseID` int NOT NULL,
  `ownerID` int NOT NULL,
  `jockeyID` int,
  `registrationNo` varchar(100) UNIQUE NOT NULL,
  `paymentStatus` varchar(50) NOT NULL DEFAULT 'UNPAID',
  `approvalStatus` varchar(50) NOT NULL DEFAULT 'PENDING',
  `rejectionReason` varchar(500),
  `submittedAt` datetime NOT NULL,
  `reviewedAt` datetime,
  `reviewedBy` int,
  `createdAt` datetime,
  `updatedAt` datetime,
  CONSTRAINT `chk_registration_payment_status`
    CHECK (`paymentStatus` IN ('UNPAID', 'PAID', 'REFUNDED', 'FAILED')),
  CONSTRAINT `chk_registration_approval_status`
    CHECK (`approvalStatus` IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  CONSTRAINT `chk_approved_registration_paid`
    CHECK (
      `approvalStatus` <> 'APPROVED'
      OR `paymentStatus` = 'PAID'
    ),
  CONSTRAINT `chk_registration_rejection_reason`
    CHECK (
      (`approvalStatus` = 'REJECTED'
        AND `rejectionReason` IS NOT NULL
        AND CHAR_LENGTH(TRIM(`rejectionReason`)) > 0)
      OR
      (`approvalStatus` <> 'REJECTED')
    ),
  CONSTRAINT `chk_registration_review_metadata`
    CHECK (
      (`approvalStatus` IN ('APPROVED', 'REJECTED')
        AND `reviewedAt` IS NOT NULL
        AND `reviewedBy` IS NOT NULL)
      OR
      (`approvalStatus` IN ('PENDING', 'CANCELLED'))
    )
);

CREATE TABLE `RaceEntry` (
  `raceEntryID` int PRIMARY KEY AUTO_INCREMENT,
  `raceID` int NOT NULL,
  `registrationID` int NOT NULL,
  `startingStall` int NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ASSIGNED',
  `assignedAt` datetime NOT NULL,
  `assignedBy` int NOT NULL,
  `cancelledAt` datetime,
  `cancelledBy` int,
  `cancellationReason` varchar(500),
  CONSTRAINT `chk_race_entry_starting_stall`
    CHECK (`startingStall` > 0),
  CONSTRAINT `chk_race_entry_status`
    CHECK (`status` IN ('ASSIGNED', 'CANCELLED')),
  CONSTRAINT `chk_race_entry_cancellation_metadata`
    CHECK (
      (
        `status` = 'ASSIGNED'
        AND `cancelledAt` IS NULL
        AND `cancelledBy` IS NULL
        AND `cancellationReason` IS NULL
      )
      OR
      (
        `status` = 'CANCELLED'
        AND `cancelledAt` IS NOT NULL
        AND `cancelledBy` IS NOT NULL
        AND `cancellationReason` IS NOT NULL
        AND CHAR_LENGTH(TRIM(`cancellationReason`)) > 0
      )
    )
);

CREATE TABLE `RefereeAssignment` (
  `assignmentID` int PRIMARY KEY AUTO_INCREMENT,
  `raceID` int UNIQUE NOT NULL,
  `refereeUserID` int NOT NULL,
  `assignedAt` datetime,
  `status` varchar(50)
);

CREATE TABLE `JockeyInvitation` (
  `invitationID` int PRIMARY KEY AUTO_INCREMENT,
  `registrationID` int,
  `tournamentID` int NOT NULL,
  `horseID` int NOT NULL,
  `ownerID` int NOT NULL,
  `jockeyID` int NOT NULL,
  `status` varchar(50),
  `message` varchar(255),
  `createdAt` datetime,
  `expiredAt` datetime,
  `respondedAt` datetime
);

CREATE UNIQUE INDEX `Race_index_0` ON `Race` (`tournamentID`, `raceName`);

CREATE UNIQUE INDEX `Race_index_1` ON `Race` (`tournamentID`, `raceOrder`);

CREATE UNIQUE INDEX `RacePrize_index_2` ON `RacePrize` (`raceID`, `rankPosition`);

CREATE UNIQUE INDEX `TournamentCondition_index_3`
ON `TournamentCondition` (`tournamentID`, `conditionType`);

CREATE INDEX `RaceEntry_registration_idx`
ON `RaceEntry` (`registrationID`);

CREATE INDEX `RaceEntry_registration_status_idx`
ON `RaceEntry` (`registrationID`, `status`);

CREATE INDEX `RaceEntry_race_status_stall_idx`
ON `RaceEntry` (`raceID`, `status`, `startingStall`);

CREATE INDEX `Registration_index_5`
ON `Registration` (`tournamentID`, `approvalStatus`);

CREATE INDEX `Registration_index_6`
ON `Registration` (`tournamentID`, `horseID`, `approvalStatus`);

CREATE INDEX `Race_index_7`
ON `Race` (`tournamentID`, `status`, `raceStartTime`);

ALTER TABLE `Users` ADD FOREIGN KEY (`roleID`) REFERENCES `Roles` (`roleID`);

ALTER TABLE `Horse` ADD FOREIGN KEY (`ownerID`) REFERENCES `Users` (`userID`);

ALTER TABLE `JockeyProfile` ADD FOREIGN KEY (`jockeyID`) REFERENCES `Users` (`userID`);

ALTER TABLE `Tournament` ADD FOREIGN KEY (`createdBy`) REFERENCES `Users` (`userID`);

ALTER TABLE `TournamentCondition` ADD FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`);

ALTER TABLE `Race` ADD FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`);

ALTER TABLE `RacePrize` ADD FOREIGN KEY (`raceID`) REFERENCES `Race` (`raceID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`horseID`) REFERENCES `Horse` (`horseID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`ownerID`) REFERENCES `Users` (`userID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`jockeyID`) REFERENCES `Users` (`userID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`reviewedBy`) REFERENCES `Users` (`userID`);

ALTER TABLE `RaceEntry` ADD FOREIGN KEY (`raceID`) REFERENCES `Race` (`raceID`);

ALTER TABLE `RaceEntry` ADD FOREIGN KEY (`registrationID`) REFERENCES `Registration` (`registrationID`);

ALTER TABLE `RaceEntry` ADD FOREIGN KEY (`assignedBy`) REFERENCES `Users` (`userID`);
ALTER TABLE `RaceEntry`
ADD FOREIGN KEY (`raceID`) REFERENCES `Race` (`raceID`);

ALTER TABLE `RaceEntry`
ADD FOREIGN KEY (`registrationID`)
REFERENCES `Registration` (`registrationID`);

ALTER TABLE `RaceEntry`
ADD FOREIGN KEY (`assignedBy`) REFERENCES `Users` (`userID`);

ALTER TABLE `RaceEntry`
ADD FOREIGN KEY (`cancelledBy`) REFERENCES `Users` (`userID`);

ALTER TABLE `RefereeAssignment` ADD FOREIGN KEY (`raceID`) REFERENCES `Race` (`raceID`);

ALTER TABLE `RefereeAssignment` ADD FOREIGN KEY (`refereeUserID`) REFERENCES `Users` (`userID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`registrationID`) REFERENCES `Registration` (`registrationID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`horseID`) REFERENCES `Horse` (`horseID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`ownerID`) REFERENCES `Users` (`userID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`jockeyID`) REFERENCES `Users` (`userID`);

INSERT INTO `Roles` (`roleID`, `roleName`) VALUES
(1, 'ADMIN'),
(2, 'OWNER'),
(3, 'JOCKEY'),
(4, 'REFEREE'),
(5, 'SPECTATOR');
