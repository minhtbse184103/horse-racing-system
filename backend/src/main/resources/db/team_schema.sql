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
  gender VARCHAR(255),
  age INT,
  weight DECIMAL(10,2),
  healthCertExpiry DATE,
  status VARCHAR(255),
  FOREIGN KEY (ownerID) REFERENCES Users(userID)
);

CREATE TABLE RaceCategory (
  categoryID INT PRIMARY KEY AUTO_INCREMENT,
  categoryName VARCHAR(255) UNIQUE NOT NULL,
  trackSurface VARCHAR(255),
  minHorseAge INT,
  allowedGender VARCHAR(255),
  distanceText VARCHAR(255),
  distanceMeter INT,
  distanceType VARCHAR(255),
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
  raceNumber INT,
  scheduledTime DATETIME,
  maxParticipants INT,
  laneCount INT,
  prizePool DECIMAL(15,2),
  status VARCHAR(255),
  FOREIGN KEY (tournamentID) REFERENCES Tournament(tournamentID),
  FOREIGN KEY (categoryID) REFERENCES RaceCategory(categoryID)
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

CREATE TABLE JockeyInvitation (
  invitationID INT PRIMARY KEY AUTO_INCREMENT,
  regID INT,
  ownerID INT,
  jockeyID INT,
  sentAt DATETIME,
  respondedAt DATETIME,
  expiredAt DATETIME,
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

CREATE TABLE LaneAssignment (
  laneAssignID INT PRIMARY KEY AUTO_INCREMENT,
  raceID INT,
  regID INT,
  laneNumber INT,
  FOREIGN KEY (raceID) REFERENCES Race(raceID),
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
  raceID INT,
  regID INT,
  finishTime DECIMAL(10,2),
  penaltyTime DECIMAL(10,2),
  totalTime DECIMAL(10,2),
  violationFlag BOOLEAN,
  isDisqualified BOOLEAN,
  status VARCHAR(255),
  FOREIGN KEY (raceID) REFERENCES Race(raceID),
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
  prizePercent DECIMAL(10,2),
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

CREATE UNIQUE INDEX Registration_index_0 ON Registration (raceID, horseID);
CREATE UNIQUE INDEX LaneAssignment_index_1 ON LaneAssignment (raceID, regID);
CREATE UNIQUE INDEX LaneAssignment_index_2 ON LaneAssignment (raceID, laneNumber);
CREATE UNIQUE INDEX RaceResult_index_3 ON RaceResult (raceID, regID);
CREATE UNIQUE INDEX FinalRanking_index_4 ON FinalRanking (raceID, finalRank);
CREATE UNIQUE INDEX PrizeRule_index_5 ON PrizeRule (raceID, rankPosition);

INSERT INTO Roles(roleID, roleName) VALUES
(1,'ADMIN'),
(2,'OWNER'),
(3,'JOCKEY'),
(4,'REFEREE'),
(5,'SPECTATOR');

INSERT INTO RaceCategory
(
  categoryID,
  categoryName,
  trackSurface,
  minHorseAge,
  allowedGender,
  distanceText,
  distanceMeter,
  distanceType,
  description
)
VALUES
(1,'Breeders Cup Classic','DIRT',3,'ALL','2000m',2000,'LONG','Ngựa từ 3 tuổi trở lên'),
(2,'Breeders Cup Distaff','DIRT',3,'FEMALE','1800m',1800,'LONG','Ngựa cái từ 3 tuổi trở lên'),
(3,'Breeders Cup Turf','TURF',3,'ALL','2400m',2400,'LONG','Ngựa từ 3 tuổi trở lên'),
(4,'Breeders Cup Mile','TURF',3,'ALL','1600m',1600,'MEDIUM','Ngựa từ 3 tuổi trở lên'),
(5,'Breeders Cup Sprint','DIRT',3,'ALL','1200m',1200,'SPRINT','Ngựa từ 3 tuổi trở lên'),
(6,'Breeders Cup Filly & Mare Turf','TURF',3,'FEMALE','2200m',2200,'LONG','Ngựa cái từ 3 tuổi trở lên'),
(7,'Breeders Cup Filly & Mare Sprint','DIRT',3,'FEMALE','1400m',1400,'SPRINT','Ngựa cái từ 3 tuổi trở lên'),
(8,'Breeders Cup Dirt Mile','DIRT',3,'ALL','1600m',1600,'MEDIUM','Ngựa từ 3 tuổi trở lên'),
(9,'Breeders Cup Juvenile','DIRT',2,'ALL','1700m',1700,'MEDIUM','Ngựa 2 tuổi'),
(10,'Breeders Cup Juvenile Fillies','DIRT',2,'FEMALE','1700m',1700,'MEDIUM','Ngựa cái 2 tuổi'),
(11,'Breeders Cup Juvenile Turf','TURF',2,'ALL','1600m',1600,'MEDIUM','Ngựa 2 tuổi'),
(12,'Breeders Cup Juvenile Fillies Turf','TURF',2,'FEMALE','1600m',1600,'MEDIUM','Ngựa cái 2 tuổi'),
(13,'Breeders Cup Turf Sprint','TURF',3,'ALL','1000m',1000,'SPRINT','Ngựa từ 3 tuổi trở lên'),
(14,'Breeders Cup Juvenile Turf Sprint','TURF',2,'ALL','1000m',1000,'SPRINT','Ngựa 2 tuổi');
