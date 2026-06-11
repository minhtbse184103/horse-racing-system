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
  `status` varchar(255),
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
  `horseName` varchar(255) UNIQUE NOT NULL,
  `breed` varchar(255),
  `gender` varchar(255),
  `color` varchar(255),
  `dayOfBirth` date,
  `weight` decimal(10,2) NOT NULL,
  `healthCertExpiry` date,
  `status` varchar(255),
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

ALTER TABLE `Horse` ADD FOREIGN KEY (`ownerID`) REFERENCES `Users` (`userID`);

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
