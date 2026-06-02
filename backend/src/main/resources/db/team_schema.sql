DROP DATABASE IF EXISTS horse_racing_system;

CREATE DATABASE horse_racing_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE horse_racing_system;

CREATE TABLE Roles (
  roleID INT PRIMARY KEY AUTO_INCREMENT,
  roleName VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE Users (
  userID INT PRIMARY KEY AUTO_INCREMENT,
  roleID INT NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  status VARCHAR(255),
  createdAt DATETIME,
  updatedAt DATETIME,
  CONSTRAINT fk_users_role
    FOREIGN KEY (roleID) REFERENCES Roles(roleID)
);

CREATE TABLE JockeyProfile (
  jockeyID INT PRIMARY KEY,
  licenseNo VARCHAR(255) UNIQUE NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  ranking VARCHAR(255),
  status VARCHAR(255),
  FOREIGN KEY (jockeyID) REFERENCES Users(userID)
);

CREATE TABLE Horse (
  horseID INT PRIMARY KEY AUTO_INCREMENT,
  ownerID INT,
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(255),
  age INT,
  weight DECIMAL(10,2),
  healthCertExpiry DATE,
  status VARCHAR(255),
  FOREIGN KEY (ownerID) REFERENCES Users(userID)
);

CREATE TABLE RaceCategory (
  categoryID INT PRIMARY KEY AUTO_INCREMENT,
  categoryName VARCHAR(255),
  maxHorseWeight DECIMAL(10,2),
  maxJockeyWeight DECIMAL(10,2),
  minRounds INT,
  maxRounds INT,
  description TEXT
);

CREATE TABLE Tournament (
  tournamentID INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  startDate DATE,
  endDate DATE,
  registrationDeadline DATETIME,
  status VARCHAR(255),
  createdBy INT,
  FOREIGN KEY (createdBy) REFERENCES Users(userID)
);

CREATE TABLE Race (
  raceID INT PRIMARY KEY AUTO_INCREMENT,
  tournamentID INT,
  categoryID INT,
  raceName VARCHAR(255) NOT NULL,
  maxParticipants INT,
  laneCount INT,
  track VARCHAR(255),
  prizePool DECIMAL(15,2),
  status VARCHAR(255),
  FOREIGN KEY (tournamentID) REFERENCES Tournament(tournamentID),
  FOREIGN KEY (categoryID) REFERENCES RaceCategory(categoryID)
);

CREATE TABLE RaceRound (
  roundID INT PRIMARY KEY AUTO_INCREMENT,
  raceID INT,
  roundNumber INT,
  distance INT,
  distanceCoefficient DECIMAL(10,2),
  scheduledTime DATETIME,
  status VARCHAR(255),
  FOREIGN KEY (raceID) REFERENCES Race(raceID)
);

CREATE TABLE Registration (
  regID INT PRIMARY KEY AUTO_INCREMENT,
  raceID INT,
  horseID INT,
  ownerID INT,
  jockeyID INT,
  registeredAt DATETIME,
  confirmedAt DATETIME,
  status VARCHAR(255),
  FOREIGN KEY (raceID) REFERENCES Race(raceID),
  FOREIGN KEY (horseID) REFERENCES Horse(horseID),
  FOREIGN KEY (ownerID) REFERENCES Users(userID),
  FOREIGN KEY (jockeyID) REFERENCES Users(userID)
);

CREATE TABLE JockeyPerformanceSummary (
  jockeyID INT PRIMARY KEY,
  totalRaces INT,
  top1Count INT,
  top2Count INT,
  top3Count INT,
  winRate DECIMAL(10,2),
  bestFinishTime DECIMAL(10,2),
  violationCount INT,
  disqualifiedCount INT,
  lastUpdatedAt DATETIME,
  FOREIGN KEY (jockeyID) REFERENCES JockeyProfile(jockeyID)
);

CREATE TABLE JockeyInvitation (
  invitationID INT PRIMARY KEY AUTO_INCREMENT,
  regID INT,
  ownerID INT,
  jockeyID INT,
  sentAt DATETIME,
  respondedAt DATETIME,
  status VARCHAR(255),
  FOREIGN KEY (regID) REFERENCES Registration(regID),
  FOREIGN KEY (ownerID) REFERENCES Users(userID),
  FOREIGN KEY (jockeyID) REFERENCES Users(userID)
);

CREATE TABLE HorsePerformanceSummary (
  horseID INT PRIMARY KEY,
  totalRaces INT,
  top1Count INT,
  top2Count INT,
  top3Count INT,
  bestTime DECIMAL(10,2),
  violationCount INT,
  disqualifiedCount INT,
  lastUpdatedAt DATETIME,
  FOREIGN KEY (horseID) REFERENCES Horse(horseID)
);

CREATE TABLE LaneAssignment (
  laneAssignID INT PRIMARY KEY AUTO_INCREMENT,
  roundID INT,
  regID INT,
  laneNumber INT,
  FOREIGN KEY (roundID) REFERENCES RaceRound(roundID),
  FOREIGN KEY (regID) REFERENCES Registration(regID)
);

CREATE TABLE RefereeAssignment (
  assignmentID INT PRIMARY KEY AUTO_INCREMENT,
  raceID INT UNIQUE NOT NULL,
  refereeID INT NOT NULL,
  assignedAt DATETIME,
  status VARCHAR(255),
  FOREIGN KEY (raceID) REFERENCES Race(raceID),
  FOREIGN KEY (refereeID) REFERENCES Users(userID)
);

CREATE TABLE RaceResult (
  resultID INT PRIMARY KEY AUTO_INCREMENT,
  roundID INT,
  regID INT,
  finishTime DECIMAL(10,2),
  distanceCoefficient DECIMAL(10,2),
  roundScore DECIMAL(10,2),
  violationFlag BOOLEAN,
  status VARCHAR(255),
  FOREIGN KEY (roundID) REFERENCES RaceRound(roundID),
  FOREIGN KEY (regID) REFERENCES Registration(regID)
);

CREATE TABLE Violation (
  violationID INT PRIMARY KEY AUTO_INCREMENT,
  resultID INT,
  refereeID INT,
  violationType VARCHAR(255),
  description TEXT,
  penaltyType VARCHAR(255),
  penaltyValue DECIMAL(10,2),
  createdAt DATETIME,
  FOREIGN KEY (resultID) REFERENCES RaceResult(resultID),
  FOREIGN KEY (refereeID) REFERENCES Users(userID)
);

CREATE TABLE RefereeReport (
  reportID INT PRIMARY KEY AUTO_INCREMENT,
  raceID INT,
  refereeID INT,
  confirmedResult BOOLEAN,
  submittedAt DATETIME,
  note TEXT,
  FOREIGN KEY (raceID) REFERENCES Race(raceID),
  FOREIGN KEY (refereeID) REFERENCES Users(userID)
);

CREATE TABLE FinalRanking (
  rankingID INT PRIMARY KEY AUTO_INCREMENT,
  raceID INT,
  regID INT UNIQUE NOT NULL,
  totalScore DECIMAL(10,2),
  bestSingleTime DECIMAL(10,2),
  finalRank INT,
  isDisqualified BOOLEAN,
  calculatedAt DATETIME,
  FOREIGN KEY (raceID) REFERENCES Race(raceID),
  FOREIGN KEY (regID) REFERENCES Registration(regID)
);

CREATE TABLE PrizeRule (
  prizeRuleID INT PRIMARY KEY AUTO_INCREMENT,
  raceID INT,
  rankPosition INT,
  prizeAmount DECIMAL(15,2),
  ownerPercent DECIMAL(10,2),
  jockeyPercent DECIMAL(10,2),
  FOREIGN KEY (raceID) REFERENCES Race(raceID)
);

CREATE TABLE PrizeDistribution (
  prizeID INT PRIMARY KEY AUTO_INCREMENT,
  rankingID INT UNIQUE NOT NULL,
  ownerID INT,
  jockeyID INT,
  totalPrize DECIMAL(15,2),
  ownerAmount DECIMAL(15,2),
  jockeyAmount DECIMAL(15,2),
  status VARCHAR(255),
  FOREIGN KEY (rankingID) REFERENCES FinalRanking(rankingID),
  FOREIGN KEY (ownerID) REFERENCES Users(userID),
  FOREIGN KEY (jockeyID) REFERENCES Users(userID)
);

CREATE TABLE Prediction (
  predID INT PRIMARY KEY AUTO_INCREMENT,
  spectatorID INT,
  raceID INT,
  predictedHorseID INT,
  predictedRank INT,
  result VARCHAR(255),
  rewardPoints INT,
  createdAt DATETIME,
  FOREIGN KEY (spectatorID) REFERENCES Users(userID),
  FOREIGN KEY (raceID) REFERENCES Race(raceID),
  FOREIGN KEY (predictedHorseID) REFERENCES Horse(horseID)
);

INSERT INTO Roles(roleID, roleName) VALUES
(1,'ADMIN'),
(2,'OWNER'),
(3,'JOCKEY'),
(4,'REFEREE'),
(5,'SPECTATOR');

INSERT INTO RaceCategory
(categoryID, categoryName, maxHorseWeight, maxJockeyWeight, minRounds, maxRounds, description)
VALUES
(1,'Amateur',450,55,1,2,'Giải nghiệp dư'),
(2,'Professional',550,65,2,3,'Giải chuyên nghiệp'),
(3,'Elite',650,75,3,5,'Giải đỉnh cao');
