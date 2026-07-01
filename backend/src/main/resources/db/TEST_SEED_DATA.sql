USE `horse_racing_system`;

-- Run once immediately after team_schema.sql on a fresh database.
-- Login password for every seeded account: admin123
-- Admin login: admin@horse.test / admin123

SET @seed_now = NOW();
SET @seed_today = CURDATE();
SET @seed_password = '$2a$10$Dn/5oVH2fgNQAgHNtQL6W.HOCNPCocwtBa01l5LHAzHyPHu1iDxs6';

START TRANSACTION;

-- Roles 1-5 are created by team_schema.sql.
INSERT INTO `Users`
  (`userID`, `roleID`, `username`, `email`, `password`, `phone`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1,  1, 'admin.demo',    'admin@horse.test',          @seed_password, '0900000001', 'ACTIVE', @seed_now, @seed_now),
  (2,  2, 'owner.alice',   'owner.alice@horse.test',    @seed_password, '0900000002', 'ACTIVE', @seed_now, @seed_now),
  (3,  2, 'owner.bao',     'owner.bao@horse.test',      @seed_password, '0900000003', 'ACTIVE', @seed_now, @seed_now),
  (4,  2, 'owner.chloe',   'owner.chloe@horse.test',    @seed_password, '0900000004', 'ACTIVE', @seed_now, @seed_now),
  (5,  3, 'jockey.daniel', 'jockey.daniel@horse.test',  @seed_password, '0900000005', 'ACTIVE', @seed_now, @seed_now),
  (6,  3, 'jockey.emma',   'jockey.emma@horse.test',    @seed_password, '0900000006', 'ACTIVE', @seed_now, @seed_now),
  (7,  3, 'jockey.finn',   'jockey.finn@horse.test',    @seed_password, '0900000007', 'ACTIVE', @seed_now, @seed_now),
  (8,  4, 'referee.grace', 'referee.grace@horse.test',  @seed_password, '0900000008', 'ACTIVE', @seed_now, @seed_now),
  (9,  4, 'referee.henry', 'referee.henry@horse.test',  @seed_password, '0900000009', 'ACTIVE', @seed_now, @seed_now),
  (10, 5, 'owner.pending', 'owner.pending@horse.test',  @seed_password, '0900000010', 'ACTIVE', @seed_now, @seed_now),
  (11, 5, 'owner.rejected','owner.rejected@horse.test', @seed_password, '0900000011', 'ACTIVE', @seed_now, @seed_now);

INSERT INTO `OwnerApplication`
  (`applicationID`, `userID`, `fullName`, `dateOfBirth`, `gender`, `nationality`, `address`, `identityDocumentUrl`, `stableName`, `stableAddress`, `stableCertificateUrl`, `totalHorsesOwned`, `horseOwnershipProofUrl`, `status`, `rejectReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 2,  'Alice Tran', DATE_SUB(@seed_today, INTERVAL 35 YEAR), 'FEMALE', 'Vietnamese', 'Bangkok Stable District', 'https://example.com/owners/alice/identity.pdf', 'Alice Victory Stable', 'Bangkok Stable District, Bangkok', 'https://example.com/owners/alice/stable-certificate.pdf', 2, 'https://example.com/owners/alice/horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 120 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY), 1, DATE_SUB(@seed_now, INTERVAL 120 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  (2, 3,  'Bao Nguyen', DATE_SUB(@seed_today, INTERVAL 40 YEAR), 'MALE',   'Vietnamese', 'Chiang Mai Racing Road', 'https://example.com/owners/bao/identity.pdf', 'Bao Northern Stable', 'Chiang Mai Racing Road, Chiang Mai', 'https://example.com/owners/bao/stable-certificate.pdf', 3, 'https://example.com/owners/bao/horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 110 DAY), DATE_SUB(@seed_now, INTERVAL 108 DAY), 1, DATE_SUB(@seed_now, INTERVAL 110 DAY), DATE_SUB(@seed_now, INTERVAL 108 DAY)),
  (3, 4,  'Chloe Le',   DATE_SUB(@seed_today, INTERVAL 32 YEAR), 'FEMALE', 'Vietnamese', 'Phuket Equestrian Park', 'https://example.com/owners/chloe/identity.pdf', 'Chloe Coastal Stable', 'Phuket Equestrian Park, Phuket', 'https://example.com/owners/chloe/stable-certificate.pdf', 3, 'https://example.com/owners/chloe/horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 100 DAY), DATE_SUB(@seed_now, INTERVAL 98 DAY),  1, DATE_SUB(@seed_now, INTERVAL 100 DAY), DATE_SUB(@seed_now, INTERVAL 98 DAY)),
  (4, 10, 'Pending Owner', DATE_SUB(@seed_today, INTERVAL 28 YEAR), 'OTHER', 'Vietnamese', 'Ho Chi Minh City', 'https://example.com/owners/pending/identity.pdf', 'Pending City Stable', 'District 7, Ho Chi Minh City', 'https://example.com/owners/pending/stable-certificate.pdf', 1, 'https://example.com/owners/pending/horse-ownership.pdf', 'PENDING', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (5, 11, 'Rejected Owner', DATE_SUB(@seed_today, INTERVAL 29 YEAR), 'MALE', 'Vietnamese', 'Da Nang City', 'https://example.com/owners/rejected/identity.pdf', 'Rejected Riverside Stable', 'Hai Chau District, Da Nang', 'https://example.com/owners/rejected/stable-certificate.pdf', 1, 'https://example.com/owners/rejected/horse-ownership.pdf', 'REJECTED', 'Identity document is not readable.', DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY), 1, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY));

INSERT INTO `OwnerProfile`
  (`ownerID`, `applicationID`, `createdAt`, `updatedAt`)
VALUES
  (2, 1, DATE_SUB(@seed_now, INTERVAL 118 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  (3, 2, DATE_SUB(@seed_now, INTERVAL 108 DAY), DATE_SUB(@seed_now, INTERVAL 108 DAY)),
  (4, 3, DATE_SUB(@seed_now, INTERVAL 98 DAY),  DATE_SUB(@seed_now, INTERVAL 98 DAY));

INSERT INTO `JockeyProfile`
  (`jockeyID`, `fullName`, `weight`, `ranking`, `biography`, `totalRaces`, `totalWins`, `createdAt`, `updatedAt`)
VALUES
  (5, 'Demo Jockey Five', 52.50, 'A', 'Experienced sprint jockey.', 48, 13, DATE_SUB(@seed_now, INTERVAL 300 DAY), @seed_now),
  (6, 'Demo Jockey Six', 54.00, 'A', 'Specialist in middle-distance races.', 39, 9, DATE_SUB(@seed_now, INTERVAL 280 DAY), @seed_now),
  (7, 'Demo Jockey Seven', 55.25, 'B', 'New jockey awaiting verification.', 5, 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now);

INSERT INTO `JockeyVerification`
  (`verificationID`, `jockeyID`, `trainerName`, `trainerEmail`, `academyStableAddress`, `issuingAuthority`, `verificationLink`, `licenceType`, `expiryDate`, `verificationStatus`, `rejectionReason`, `resubmitCount`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 5, 'Trainer Somchai', 'somchai@trainer.test', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://example.com/verify/jockey-5', 'PRO', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 200 DAY), DATE_SUB(@seed_now, INTERVAL 198 DAY), 1, DATE_SUB(@seed_now, INTERVAL 200 DAY), DATE_SUB(@seed_now, INTERVAL 198 DAY)),
  (2, 6, 'Trainer Mali', 'mali@trainer.test', 'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://example.com/verify/jockey-6', 'PRO', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 188 DAY), 1, DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 188 DAY)),
  (3, 7, 'Trainer Arun', 'arun@trainer.test', 'Phuket Riding School', 'Thailand Racing Authority', 'https://example.com/verify/jockey-7', 'PRO', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'PENDING', NULL, 0, DATE_SUB(@seed_now, INTERVAL 2 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY));

INSERT INTO `JockeyVerificationFile`
  (`fileID`, `verificationID`, `fileUrl`, `fileType`, `uploadedAt`)
VALUES
  (1, 1, 'https://example.com/documents/jockey-5-license.pdf', 'PDF', DATE_SUB(@seed_now, INTERVAL 200 DAY)),
  (2, 2, 'https://example.com/documents/jockey-6-license.pdf', 'PDF', DATE_SUB(@seed_now, INTERVAL 190 DAY)),
  (3, 3, 'https://example.com/documents/jockey-7-license.pdf', 'PDF', DATE_SUB(@seed_now, INTERVAL 2 DAY));

INSERT INTO `Horse`
  (`horseID`, `ownerID`, `horseName`, `age`, `dayOfBirth`, `weight`, `colour`, `sex`, `breeding`, `trainer`, `healthCertExpiry`, `healthCertificateUrl`, `officialHorseProfileUrl`, `status`, `rejectionReason`, `createdAt`, `updatedAt`)
VALUES
  (1, 2, 'Demo Thunder', 4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 480.00, 'Bay',      'MALE',   'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/1/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-thunder', 'ACTIVE', NULL, @seed_now, @seed_now),
  (2, 2, 'Demo Comet',   5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 495.00, 'Chestnut', 'MALE',   'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/2/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-comet', 'ACTIVE', NULL, @seed_now, @seed_now),
  (3, 3, 'Demo Atlas',   6, DATE_SUB(@seed_today, INTERVAL 6 YEAR), 510.00, 'Black',    'MALE',   'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/3/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-atlas', 'ACTIVE', NULL, @seed_now, @seed_now),
  (4, 3, 'Demo Rocket',  4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 500.00, 'Grey',     'MALE',   'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/4/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-rocket', 'ACTIVE', NULL, @seed_now, @seed_now),
  (5, 4, 'Demo Blaze',   7, DATE_SUB(@seed_today, INTERVAL 7 YEAR), 520.00, 'Bay',      'MALE',   'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/5/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-blaze', 'ACTIVE', NULL, @seed_now, @seed_now),
  (6, 4, 'Demo Legacy',  8, DATE_SUB(@seed_today, INTERVAL 8 YEAR), 530.00, 'Brown',    'MALE',   'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/6/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-legacy', 'ACTIVE', NULL, @seed_now, @seed_now),
  (7, 4, 'Demo Aurora',  5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 475.00, 'Grey',     'FEMALE', 'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/7/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-aurora', 'PENDING', NULL, @seed_now, @seed_now),
  (8, 3, 'Demo Eclipse', 6, DATE_SUB(@seed_today, INTERVAL 6 YEAR), 490.00, 'Black',    'FEMALE', 'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/8/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-eclipse', 'REJECTED', 'Health certificate image is unclear.', @seed_now, @seed_now);

INSERT INTO `Tournament`
  (`tournamentID`, `tournamentName`, `venue`, `venueImageUrl`, `description`, `registrationOpenAt`, `registrationCloseAt`, `startDate`, `endDate`, `maxRegistrations`, `entryFee`, `status`, `createdBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 'Demo Future Championship', 'Bangkok Equestrian Park', NULL, 'Open Tournament for Admin Event demonstrations.', DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_ADD(@seed_now, INTERVAL 30 DAY), DATE_ADD(@seed_today, INTERVAL 40 DAY), DATE_ADD(@seed_today, INTERVAL 42 DAY), 24, 1000000.00, 'OPEN_FOR_REGISTRATION', 1, @seed_now, @seed_now),
  (2, 'Demo Heritage Cup', 'Chiang Mai Racecourse', NULL, 'Completed Tournament retained for history and result views.', DATE_SUB(@seed_now, INTERVAL 180 DAY), DATE_SUB(@seed_now, INTERVAL 150 DAY), DATE_SUB(@seed_today, INTERVAL 120 DAY), DATE_SUB(@seed_today, INTERVAL 118 DAY), 20, 2000000.00, 'COMPLETED', 1, DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY));

INSERT INTO `TournamentCondition`
  (`conditionID`, `tournamentID`, `conditionType`, `operator`, `minValue`, `maxValue`, `value`)
VALUES
  (1, 1, 'AGE',    'BETWEEN', 3.00, 10.00, NULL),
  (2, 1, 'WEIGHT', 'LTE',     NULL, NULL, '550'),
  (3, 1, 'GENDER', 'EQ',      NULL, NULL, 'MALE'),
  (4, 2, 'AGE',    'BETWEEN', 3.00, 12.00, NULL);

INSERT INTO `Race`
  (`raceID`, `tournamentID`, `raceName`, `trackName`, `raceStartTime`, `raceEndTime`, `distance`, `maxRunners`, `raceOrder`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 'Future Sprint',    'Bangkok Track A', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 40 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 40 DAY), '10:30:00'), 1200, 6, 1, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (2, 1, 'Future Classic',   'Bangkok Track A', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 41 DAY), '13:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 41 DAY), '13:45:00'), 1800, 6, 2, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (3, 1, 'Future Endurance', 'Bangkok Track B', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 42 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 42 DAY), '16:00:00'), 2400, 6, 3, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (4, 2, 'Heritage Sprint',  'Chiang Mai Main', TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 120 DAY), '10:00:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 120 DAY), '10:30:00'), 1200, 6, 1, 'COMPLETED', DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 120 DAY)),
  (5, 2, 'Heritage Classic', 'Chiang Mai Main', TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 119 DAY), '14:00:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 119 DAY), '14:45:00'), 1800, 6, 2, 'COMPLETED', DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  -- Manual-mode launch test race: raceStartTime is already in the past and
  -- status is OPEN_FOR_REGISTRATION, so RaceEngineLaunchService.refreshRaceStatus
  -- flips it to READY the moment the workspace or launch flow refreshes it;
  -- "Run Race" then moves it to IN_PROGRESS after Unity launch succeeds (no waiting on
  -- the clock). Has 6 ASSIGNED RaceEntry rows below, matching the Unity
  -- simulator capacity and satisfying
  -- MIN_RUNNERS_TO_LAUNCH, and no RaceResult yet, so it's launchable and
  -- ready to receive a result from Unity right after seeding.
  (6, 1, 'Live Test Race',   'Bangkok Track A', DATE_SUB(@seed_now, INTERVAL 1 HOUR), DATE_ADD(@seed_now, INTERVAL 1 HOUR), 1000, 6, 4, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now);

INSERT INTO `RacePrize`
  (`racePrizeID`, `raceID`, `rankPosition`, `amount`, `ownerPercent`, `jockeyPercent`)
VALUES
  (1,  1, 1, 50000000.00, 80.00, 20.00), (2,  1, 2, 30000000.00, 80.00, 20.00), (3,  1, 3, 20000000.00, 80.00, 20.00),
  (4,  2, 1, 75000000.00, 80.00, 20.00), (5,  2, 2, 45000000.00, 80.00, 20.00), (6,  2, 3, 30000000.00, 80.00, 20.00),
  (7,  3, 1, 90000000.00, 80.00, 20.00), (8,  3, 2, 54000000.00, 80.00, 20.00), (9,  3, 3, 36000000.00, 80.00, 20.00),
  (10, 4, 1, 40000000.00, 80.00, 20.00), (11, 4, 2, 24000000.00, 80.00, 20.00), (12, 4, 3, 16000000.00, 80.00, 20.00),
  (13, 5, 1, 60000000.00, 80.00, 20.00), (14, 5, 2, 36000000.00, 80.00, 20.00), (15, 5, 3, 24000000.00, 80.00, 20.00),
  (16, 6, 1, 20000000.00, 80.00, 20.00), (17, 6, 2, 12000000.00, 80.00, 20.00), (18, 6, 3, 8000000.00,  80.00, 20.00);

INSERT INTO `Registration`
  (`registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `registrationNo`, `paymentStatus`, `approvalStatus`, `rejectionReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 1, 2, 5,    'REG-DEMO-001', 'PAID',   'PENDING',   NULL, DATE_SUB(@seed_now, INTERVAL 5 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY)),
  (2, 1, 2, 2, NULL, 'REG-DEMO-002', 'UNPAID', 'PENDING',   NULL, DATE_SUB(@seed_now, INTERVAL 4 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY)),
  (3, 1, 3, 3, 6,    'REG-DEMO-003', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY), 1, DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY)),
  (4, 1, 4, 3, 5,    'REG-DEMO-004', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY), 1, DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (5, 1, 5, 4, 5,    'REG-DEMO-005', 'UNPAID', 'REJECTED',  'Health document requires clearer verification.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (6, 2, 6, 4, 6,    'REG-DEMO-006', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 155 DAY), 1, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  (7, 1, 1, 2, 5,    'REG-DEMO-007', 'UNPAID', 'CANCELLED', NULL, DATE_SUB(@seed_now, INTERVAL 20 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 20 DAY), DATE_SUB(@seed_now, INTERVAL 18 DAY)),
  -- Dedicated registrations for Race 6 (Live Test Race). Each row below
  -- is used once by one ASSIGNED RaceEntry so Unity receives a full
  -- six-runner lineup without any registration having two ASSIGNED entries.
  (8, 1, 1, 2, 5,    'REG-DEMO-008', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (9, 1, 2, 2, 6,    'REG-DEMO-009', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (10, 1, 3, 3, 5,   'REG-DEMO-010', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (11, 1, 4, 3, 6,   'REG-DEMO-011', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (12, 1, 5, 4, 5,   'REG-DEMO-012', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (13, 1, 6, 4, 6,   'REG-DEMO-013', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now);

INSERT INTO `RaceEntry`
  (`raceEntryID`, `raceID`, `registrationID`, `startingStall`, `status`, `assignedAt`, `assignedBy`, `cancelledAt`, `cancelledBy`, `cancellationReason`)
VALUES
  (1, 1, 4, 1, 'ASSIGNED',  DATE_SUB(@seed_now, INTERVAL 2 DAY), 1, NULL, NULL, NULL),
  (2, 2, 3, 2, 'CANCELLED', DATE_SUB(@seed_now, INTERVAL 2 DAY), 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, 'Owner requested reassignment before race start.'),
  (3, 4, 6, 3, 'ASSIGNED',  DATE_SUB(@seed_now, INTERVAL 130 DAY), 1, NULL, NULL, NULL),
  -- Race 6 (Live Test Race) entries: six active stalls for Unity's
  -- maximum supported race size. Each RaceEntry uses a dedicated
  -- registration from 8 through 13 above.
  (4, 6, 8, 1, 'ASSIGNED',  @seed_now, 1, NULL, NULL, NULL),
  (5, 6, 9, 2, 'ASSIGNED',  @seed_now, 1, NULL, NULL, NULL),
  (6, 6, 10, 3, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (7, 6, 11, 4, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (8, 6, 12, 5, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (9, 6, 13, 6, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL);

INSERT INTO `RaceResult`
  (`resultID`, `raceEntryID`, `finishPosition`, `finishTime`, `points`, `prizeMoney`, `recordedAt`, `recordedBy`)
VALUES
  (1, 3, 1, '00:01:12.450', 10, 40000000.00, DATE_SUB(@seed_now, INTERVAL 120 DAY), 8);

INSERT INTO `RefereeAssignment`
  (`assignmentID`, `raceID`, `refereeUserID`, `assignedAt`, `status`)
VALUES
  (1, 1, 8, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (2, 2, 9, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (3, 3, 8, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (4, 4, 8, DATE_SUB(@seed_now, INTERVAL 130 DAY), 'COMPLETED'),
  (5, 5, 9, DATE_SUB(@seed_now, INTERVAL 130 DAY), 'COMPLETED');

INSERT INTO `JockeyInvitation`
  (`invitationID`, `registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `status`, `message`, `createdAt`, `expiredAt`, `respondedAt`)
VALUES
  (1, 1, 1, 1, 2, 5, 'ACCEPTED', 'Please ride Demo Thunder in the Future Championship.', DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_ADD(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY)),
  (2, 2, 1, 2, 2, 6, 'PENDING',  'Invitation to partner with Demo Comet.', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 7 DAY), NULL),
  (3, 3, 1, 3, 3, 6, 'ACCEPTED', 'Accepted invitation for an approved Registration.', DATE_SUB(@seed_now, INTERVAL 8 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 7 DAY));

COMMIT;

-- Expected row counts after a successful import.
SELECT 'Roles' AS `tableName`, COUNT(*) AS `rowCount` FROM `Roles`
UNION ALL SELECT 'Users', COUNT(*) FROM `Users`
UNION ALL SELECT 'OwnerApplication', COUNT(*) FROM `OwnerApplication`
UNION ALL SELECT 'OwnerProfile', COUNT(*) FROM `OwnerProfile`
UNION ALL SELECT 'Horse', COUNT(*) FROM `Horse`
UNION ALL SELECT 'JockeyProfile', COUNT(*) FROM `JockeyProfile`
UNION ALL SELECT 'JockeyVerification', COUNT(*) FROM `JockeyVerification`
UNION ALL SELECT 'JockeyVerificationFile', COUNT(*) FROM `JockeyVerificationFile`
UNION ALL SELECT 'Tournament', COUNT(*) FROM `Tournament`
UNION ALL SELECT 'TournamentCondition', COUNT(*) FROM `TournamentCondition`
UNION ALL SELECT 'Race', COUNT(*) FROM `Race`
UNION ALL SELECT 'RacePrize', COUNT(*) FROM `RacePrize`
UNION ALL SELECT 'Registration', COUNT(*) FROM `Registration`
UNION ALL SELECT 'RaceEntry', COUNT(*) FROM `RaceEntry`
UNION ALL SELECT 'RaceResult', COUNT(*) FROM `RaceResult`
UNION ALL SELECT 'RefereeAssignment', COUNT(*) FROM `RefereeAssignment`
UNION ALL SELECT 'JockeyInvitation', COUNT(*) FROM `JockeyInvitation`;
