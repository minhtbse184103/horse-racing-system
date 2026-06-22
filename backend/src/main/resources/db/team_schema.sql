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
  `username` varchar(255) UNIQUE NOT NULL,
  `email` varchar(255) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) UNIQUE,
  `status` varchar(255),
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `OwnerApplication` (
  `applicationID` int PRIMARY KEY AUTO_INCREMENT,
  `userID` int NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `dateOfBirth` date NOT NULL,
  `gender` varchar(50) NOT NULL,
  `nationality` varchar(255) NOT NULL,
  `address` varchar(500) NOT NULL,
  `identityDocumentImage` text,
  `identityDocumentFileName` varchar(255),
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `rejectReason` varchar(500),
  `submittedAt` datetime,
  `reviewedAt` datetime,
  `reviewedBy` int,
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `OwnerProfile` (
  `ownerID` int PRIMARY KEY,
  `applicationID` int UNIQUE NOT NULL,
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `TournamentCondition` (
  `conditionID` int PRIMARY KEY AUTO_INCREMENT,
  `conditionName` varchar(255) UNIQUE NOT NULL,
  `maxHorseWeight` decimal(10,2) NOT NULL,
  `maxJockeyWeight` decimal(10,2) NOT NULL,
  `description` varchar(255)
);

CREATE TABLE `Tournament` (
  `tournamentID` int PRIMARY KEY AUTO_INCREMENT,
  `tournamentName` varchar(255) NOT NULL,
  `location` varchar(255),
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `registrationDeadline` datetime NOT NULL,
  `minParticipants` int NOT NULL,
  `maxParticipants` int NOT NULL,
  `conditionID` int NOT NULL,
  `status` varchar(255),
  `createdBy` int NOT NULL,
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `Registration` (
  `registrationID` int PRIMARY KEY AUTO_INCREMENT,
  `tournamentID` int NOT NULL,
  `horseID` int NOT NULL,
  `ownerID` int NOT NULL,
  `jockeyID` int,
  `status` varchar(255),
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `TournamentRound` (
  `roundID` int PRIMARY KEY AUTO_INCREMENT,
  `tournamentID` int NOT NULL,
  `roundName` varchar(255) NOT NULL,
  `roundOrder` int NOT NULL,
  `status` varchar(255)
);

CREATE TABLE `Race` (
  `raceID` int PRIMARY KEY AUTO_INCREMENT,
  `roundID` int NOT NULL,
  `raceName` varchar(255) NOT NULL,
  `startTime` datetime,
  `endTime` datetime,
  `raceOrder` int,
  `distance` int,
  `status` varchar(255)
);

CREATE TABLE `RaceEntry` (
  `raceEntryID` int PRIMARY KEY AUTO_INCREMENT,
  `raceID` int NOT NULL,
  `registrationID` int NOT NULL,
  `laneNumber` int,
  `status` varchar(255)
);

CREATE TABLE `RefereeAssignment` (
  `assignmentID` int PRIMARY KEY AUTO_INCREMENT,
  `raceID` int UNIQUE NOT NULL,
  `refereeUserID` int NOT NULL,
  `assignedAt` datetime,
  `status` varchar(255)
);

CREATE TABLE `Horse` (
  `horseID` int PRIMARY KEY AUTO_INCREMENT,
  `ownerID` int NOT NULL,
  `passportNumber` varchar(255) UNIQUE NOT NULL,
  `horseName` varchar(255) UNIQUE NOT NULL,
  `breed` varchar(255) NOT NULL,
  `gender` varchar(50) NOT NULL,
  `color` varchar(255) NOT NULL,
  `dayOfBirth` date NOT NULL,
  `weight` decimal(10,2) NOT NULL,
  `healthCertExpiry` date NOT NULL,
  `horsePassportUrl` text NOT NULL,
  `healthCertificateUrl` text NOT NULL,
  `horseImageUrl` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `rejectionReason` varchar(500),
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `JockeyProfile` (
  `jockeyID` int PRIMARY KEY,
  `licenseNo` varchar(255) UNIQUE NOT NULL,
  `weight` decimal(10,2) NOT NULL,
  `ranking` varchar(255),
  `status` varchar(255),
  `rejectionReason` varchar(500),
  `img_url` text,
  `createdAt` datetime,
  `updatedAt` datetime
);

CREATE TABLE `JockeyInvitation` (
  `invitationID` int PRIMARY KEY AUTO_INCREMENT,
  `registrationID` int,
  `tournamentID` int NOT NULL,
  `horseID` int NOT NULL,
  `ownerID` int NOT NULL,
  `jockeyID` int NOT NULL,
  `status` varchar(255),
  `message` varchar(255),
  `createdAt` datetime,
  `expiredAt` datetime,
  `respondedAt` datetime
);

ALTER TABLE `Users` ADD FOREIGN KEY (`roleID`) REFERENCES `Roles` (`roleID`);

ALTER TABLE `OwnerApplication` ADD FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`);

ALTER TABLE `OwnerApplication` ADD FOREIGN KEY (`reviewedBy`) REFERENCES `Users` (`userID`);

ALTER TABLE `OwnerProfile` ADD FOREIGN KEY (`ownerID`) REFERENCES `Users` (`userID`);

ALTER TABLE `OwnerProfile` ADD FOREIGN KEY (`applicationID`) REFERENCES `OwnerApplication` (`applicationID`);

ALTER TABLE `Tournament` ADD FOREIGN KEY (`conditionID`) REFERENCES `TournamentCondition` (`conditionID`);

ALTER TABLE `Tournament` ADD FOREIGN KEY (`createdBy`) REFERENCES `Users` (`userID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`horseID`) REFERENCES `Horse` (`horseID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`ownerID`) REFERENCES `Users` (`userID`);

ALTER TABLE `Registration` ADD FOREIGN KEY (`jockeyID`) REFERENCES `Users` (`userID`);

ALTER TABLE `TournamentRound` ADD FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`);

ALTER TABLE `Race` ADD FOREIGN KEY (`roundID`) REFERENCES `TournamentRound` (`roundID`);

ALTER TABLE `RaceEntry` ADD FOREIGN KEY (`raceID`) REFERENCES `Race` (`raceID`);

ALTER TABLE `RaceEntry` ADD FOREIGN KEY (`registrationID`) REFERENCES `Registration` (`registrationID`);

ALTER TABLE `RefereeAssignment` ADD FOREIGN KEY (`raceID`) REFERENCES `Race` (`raceID`);

ALTER TABLE `RefereeAssignment` ADD FOREIGN KEY (`refereeUserID`) REFERENCES `Users` (`userID`);

ALTER TABLE `Horse` ADD FOREIGN KEY (`ownerID`) REFERENCES `OwnerProfile` (`ownerID`);

ALTER TABLE `JockeyProfile` ADD FOREIGN KEY (`jockeyID`) REFERENCES `Users` (`userID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`registrationID`) REFERENCES `Registration` (`registrationID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`tournamentID`) REFERENCES `Tournament` (`tournamentID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`horseID`) REFERENCES `Horse` (`horseID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`ownerID`) REFERENCES `Users` (`userID`);

ALTER TABLE `JockeyInvitation` ADD FOREIGN KEY (`jockeyID`) REFERENCES `Users` (`userID`);

ALTER TABLE TournamentRound
ADD CONSTRAINT uq_tournament_round_order
UNIQUE (tournamentID, roundOrder);

ALTER TABLE TournamentRound
ADD CONSTRAINT uq_tournament_round_name
UNIQUE (tournamentID, roundName);

ALTER TABLE Race
ADD CONSTRAINT uq_round_race_order
UNIQUE (roundID, raceOrder);

ALTER TABLE Race
ADD CONSTRAINT uq_round_race_name
UNIQUE (roundID, raceName);

ALTER TABLE RaceEntry
ADD CONSTRAINT uq_race_registration
UNIQUE (raceID, registrationID);

ALTER TABLE RaceEntry
ADD CONSTRAINT uq_race_lane
UNIQUE (raceID, laneNumber);

INSERT INTO Roles(roleID, roleName) VALUES
(1,'ADMIN'),
(2,'OWNER'),
(3,'JOCKEY'),
(4,'REFEREE'),
(5,'SPECTATOR');
INSERT INTO TournamentCondition
(conditionID, conditionName, maxHorseWeight, maxJockeyWeight, description)
VALUES
(1, 'Lightweight', 450.00, 55.00, 'Lightweight tournament condition'),
(2, 'Featherweight', 550.00, 65.00, 'Featherweight tournament condition'),
(3, 'Heavyweight', 650.00, 75.00, 'Heavyweight tournament condition');

-- Baseline accounts for local API and frontend testing.
-- Passwords are plain text intentionally; the backend upgrades them to BCrypt
-- after the first successful login.
INSERT INTO Users
(userID, roleID, username, email, password, phone, status, createdAt, updatedAt)
VALUES
(1, 1, 'Admin Test', 'admin@c.com', 'admin123', '0900000001', 'ACTIVE', NOW(), NOW()),
(2, 2, 'Owner Test', 'owner@test.com', 'owner123', '0900000002', 'ACTIVE', NOW(), NOW()),
(3, 3, 'Active Jockey', 'jockey@test.com', 'jockey123', '0900000003', 'ACTIVE', NOW(), NOW()),
(4, 3, 'Jockey Under Review', 'jockey.review@test.com', 'jockey123', '0900000004',
 'UNDER_REVIEW', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, 3, 'Rejected Jockey', 'jockey.rejected@test.com', 'jockey123', '0900000005',
 'REJECTED', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 3, 'Pending Jockey', 'jockey.pending@test.com', 'jockey123', '0900000006',
 'PENDING', NOW(), NOW()),
(7, 4, 'Referee Test', 'referee@test.com', 'referee123', '0900000007', 'ACTIVE', NOW(), NOW()),
(8, 5, 'Spectator Test', 'spectator@test.com', 'spectator123', '0900000008', 'ACTIVE', NOW(), NOW());

INSERT INTO OwnerApplication
(applicationID, userID, fullName, dateOfBirth, gender, nationality, address, status, rejectReason, submittedAt, reviewedAt, reviewedBy, createdAt, updatedAt)
VALUES
(1, 2, 'Owner Test', '1990-01-01', 'MALE', 'Vietnamese', 'Ho Chi Minh City', 'APPROVED', NULL,
 DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), 1, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY));

INSERT INTO OwnerProfile
(ownerID, applicationID, createdAt, updatedAt)
VALUES
(2, 1, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY));

INSERT INTO JockeyProfile
(jockeyID, licenseNo, weight, ranking, status, rejectionReason, img_url, createdAt, updatedAt)
VALUES
(3, 'JOCKEY-ACTIVE-001', 52.00, 'PROFESSIONAL', 'ACTIVE', NULL,
 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a',
 DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 'JOCKEY-REVIEW-001', 51.00, 'INTERMEDIATE', 'UNDER_REVIEW', NULL,
 'https://images.unsplash.com/photo-1517328874681-6e2d2e1f1ea8',
 DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, 'JOCKEY-REJECTED-001', 53.00, 'BEGINNER', 'REJECTED',
 'License proof image is unclear.',
 'https://images.unsplash.com/photo-1450052590821-8bf91254a353',
 DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Jockey review test cases:
-- jockey.review@test.com: approve or reject through the admin review API.
-- jockey.rejected@test.com: update profile to resubmit it as UNDER_REVIEW.
-- jockey.pending@test.com: create a profile to submit it for review.
