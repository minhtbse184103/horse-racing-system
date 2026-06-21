USE `horse_racing_system`;

-- Run once immediately after team_schema.sql on a fresh database.
-- Demo login password for every seeded user: Demo123!
-- BCrypt strength: 10.

SET @seed_now = NOW();
SET @seed_today = CURDATE();
SET @demo_password = '$2a$10$todP5b88icd0aLb70vBXhOQF0CcQKzhkdmEg2tTHNqKqcIbdx2Kci';

START TRANSACTION;

-- Roles 1-5 are inserted by team_schema.sql.
INSERT INTO `Users`
  (`userID`, `roleID`, `fullName`, `email`, `password`, `phone`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 'Demo Administrator', 'admin.demo@horse.test', @demo_password, '0900000001', 'ACTIVE', @seed_now, @seed_now),
  (2, 2, 'Owner Alice Tran',    'owner.alice@horse.test', @demo_password, '0900000002', 'ACTIVE', @seed_now, @seed_now),
  (3, 2, 'Owner Bao Nguyen',    'owner.bao@horse.test',   @demo_password, '0900000003', 'ACTIVE', @seed_now, @seed_now),
  (4, 2, 'Owner Chloe Le',      'owner.chloe@horse.test', @demo_password, '0900000004', 'ACTIVE', @seed_now, @seed_now),
  (5, 3, 'Jockey Daniel Pham',  'jockey.daniel@horse.test', @demo_password, '0900000005', 'ACTIVE', @seed_now, @seed_now),
  (6, 3, 'Jockey Emma Vo',      'jockey.emma@horse.test',   @demo_password, '0900000006', 'ACTIVE', @seed_now, @seed_now),
  (7, 3, 'Jockey Finn Hoang',   'jockey.finn@horse.test',   @demo_password, '0900000007', 'ACTIVE', @seed_now, @seed_now),
  (8, 4, 'Referee Grace Do',    'referee.grace@horse.test', @demo_password, '0900000008', 'ACTIVE', @seed_now, @seed_now),
  (9, 4, 'Referee Henry Bui',   'referee.henry@horse.test', @demo_password, '0900000009', 'ACTIVE', @seed_now, @seed_now);

INSERT INTO `JockeyProfile`
  (`jockeyID`, `licenseNo`, `weight`, `ranking`, `status`, `rejectionReason`, `img_url`, `createdAt`, `updatedAt`)
VALUES
  (5, 'JCK-DEMO-001', 52.50, 'A', 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (6, 'JCK-DEMO-002', 54.00, 'A', 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (7, 'JCK-DEMO-003', 55.25, 'B', 'ACTIVE', NULL, NULL, @seed_now, @seed_now);

INSERT INTO `Horse`
  (`horseID`, `ownerID`, `horseName`, `breed`, `gender`, `color`, `dayOfBirth`, `weight`, `healthCertExpiry`, `status`, `rejectionReason`, `img_url`, `createdAt`, `updatedAt`)
VALUES
  (1, 2, 'Demo Thunder', 'Thoroughbred', 'MALE',   'Bay',      DATE_SUB(@seed_today, INTERVAL 4 YEAR), 480.00, DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (2, 2, 'Demo Comet',   'Thoroughbred', 'MALE',   'Chestnut', DATE_SUB(@seed_today, INTERVAL 5 YEAR), 495.00, DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (3, 3, 'Demo Atlas',   'Thoroughbred', 'MALE',   'Black',    DATE_SUB(@seed_today, INTERVAL 6 YEAR), 510.00, DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (4, 3, 'Demo Rocket',  'Thoroughbred', 'MALE',   'Grey',     DATE_SUB(@seed_today, INTERVAL 4 YEAR), 500.00, DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (5, 4, 'Demo Blaze',   'Thoroughbred', 'MALE',   'Bay',      DATE_SUB(@seed_today, INTERVAL 7 YEAR), 520.00, DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (6, 4, 'Demo Legacy',  'Thoroughbred', 'MALE',   'Brown',    DATE_SUB(@seed_today, INTERVAL 8 YEAR), 530.00, DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (7, 4, 'Demo Aurora',  'Thoroughbred', 'FEMALE', 'Grey',     DATE_SUB(@seed_today, INTERVAL 5 YEAR), 475.00, DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'ACTIVE', NULL, NULL, @seed_now, @seed_now),
  (8, 3, 'Demo Eclipse', 'Thoroughbred', 'FEMALE', 'Black',    DATE_SUB(@seed_today, INTERVAL 6 YEAR), 490.00, DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'ACTIVE', NULL, NULL, @seed_now, @seed_now);

INSERT INTO `Tournament`
  (`tournamentID`, `tournamentName`, `venue`, `venueImageUrl`, `description`, `registrationOpenAt`, `registrationCloseAt`, `startDate`, `endDate`, `maxRegistrations`, `entryFee`, `status`, `createdBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 'Demo Future Championship', 'Bangkok Equestrian Park', NULL, 'Open tournament for end-to-end demonstrations.',
    DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_ADD(@seed_now, INTERVAL 30 DAY),
    DATE_ADD(@seed_today, INTERVAL 40 DAY), DATE_ADD(@seed_today, INTERVAL 42 DAY),
    24, 1500.00, 'OPEN_FOR_REGISTRATION', 1, @seed_now, @seed_now),
  (2, 'Demo Heritage Cup', 'Chiang Mai Racecourse', NULL, 'Completed tournament retained for historical views.',
    DATE_SUB(@seed_now, INTERVAL 180 DAY), DATE_SUB(@seed_now, INTERVAL 150 DAY),
    DATE_SUB(@seed_today, INTERVAL 120 DAY), DATE_SUB(@seed_today, INTERVAL 118 DAY),
    20, 1200.00, 'COMPLETED', 1, DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY));

INSERT INTO `TournamentCondition`
  (`conditionID`, `tournamentID`, `conditionType`, `operator`, `minValue`, `maxValue`, `value`)
VALUES
  (1, 1, 'AGE',    'BETWEEN', 3.00, 10.00, NULL),
  (2, 1, 'WEIGHT', 'LTE',     NULL, NULL, '550'),
  (3, 1, 'GENDER', 'EQ',      NULL, NULL, 'MALE');

INSERT INTO `Race`
  (`raceID`, `tournamentID`, `raceName`, `trackName`, `raceStartTime`, `raceEndTime`, `distance`, `maxRunners`, `raceOrder`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 'Future Sprint',    'Bangkok Track A', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 40 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 40 DAY), '10:30:00'), 1200, 8,  1, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (2, 1, 'Future Classic',   'Bangkok Track A', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 41 DAY), '13:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 41 DAY), '13:45:00'), 1800, 10, 2, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (3, 1, 'Future Endurance', 'Bangkok Track B', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 42 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 42 DAY), '16:00:00'), 2400, 12, 3, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (4, 2, 'Heritage Sprint',  'Chiang Mai Main', TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 120 DAY), '10:00:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 120 DAY), '10:30:00'), 1200, 8,  1, 'COMPLETED', DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 120 DAY)),
  (5, 2, 'Heritage Classic', 'Chiang Mai Main', TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 119 DAY), '14:00:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 119 DAY), '14:45:00'), 1800, 10, 2, 'COMPLETED', DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 119 DAY));

INSERT INTO `RacePrize`
  (`racePrizeID`, `raceID`, `rankPosition`, `amount`, `ownerPercent`, `jockeyPercent`)
VALUES
  (1,  1, 1, 50000.00, 80.00, 20.00), (2,  1, 2, 30000.00, 80.00, 20.00), (3,  1, 3, 20000.00, 80.00, 20.00),
  (4,  2, 1, 75000.00, 80.00, 20.00), (5,  2, 2, 45000.00, 80.00, 20.00), (6,  2, 3, 30000.00, 80.00, 20.00),
  (7,  3, 1, 90000.00, 80.00, 20.00), (8,  3, 2, 54000.00, 80.00, 20.00), (9,  3, 3, 36000.00, 80.00, 20.00),
  (10, 4, 1, 40000.00, 80.00, 20.00), (11, 4, 2, 24000.00, 80.00, 20.00), (12, 4, 3, 16000.00, 80.00, 20.00),
  (13, 5, 1, 60000.00, 80.00, 20.00), (14, 5, 2, 36000.00, 80.00, 20.00), (15, 5, 3, 24000.00, 80.00, 20.00);

INSERT INTO `Registration`
  (`registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `registrationNo`, `paymentStatus`, `approvalStatus`, `rejectionReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 1, 2, 5,    'REG-DEMO-001', 'PAID',   'PENDING',  NULL, DATE_SUB(@seed_now, INTERVAL 5 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY)),
  (2, 1, 2, 2, NULL, 'REG-DEMO-002', 'UNPAID', 'PENDING',  NULL, DATE_SUB(@seed_now, INTERVAL 4 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY)),
  (3, 1, 3, 3, 6,    'REG-DEMO-003', 'PAID',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY), 1, DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY)),
  (4, 1, 4, 3, 7,    'REG-DEMO-004', 'PAID',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY), 1, DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (5, 1, 5, 4, 5,    'REG-DEMO-005', 'UNPAID', 'REJECTED', 'Health document requires clearer verification.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (6, 2, 6, 4, 6,    'REG-DEMO-006', 'PAID',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 155 DAY), 1, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY));

INSERT INTO `RaceEntry`
  (`raceEntryID`, `raceID`, `registrationID`, `startingStall`, `status`, `assignedAt`, `assignedBy`, `cancelledAt`, `cancelledBy`, `cancellationReason`)
VALUES
  (1, 1, 3, 1, 'ASSIGNED',  DATE_SUB(@seed_now, INTERVAL 2 DAY), 1, NULL, NULL, NULL),
  (2, 2, 4, 2, 'CANCELLED', DATE_SUB(@seed_now, INTERVAL 2 DAY), 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, 'Owner requested reassignment before race start.');

INSERT INTO `RefereeAssignment`
  (`assignmentID`, `raceID`, `refereeUserID`, `assignedAt`, `status`)
VALUES
  (1, 1, 8, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (2, 2, 9, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (3, 3, 8, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (4, 4, 8, DATE_SUB(@seed_now, INTERVAL 130 DAY), 'ASSIGNED'),
  (5, 5, 9, DATE_SUB(@seed_now, INTERVAL 130 DAY), 'ASSIGNED');

INSERT INTO `JockeyInvitation`
  (`invitationID`, `registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `status`, `message`, `createdAt`, `expiredAt`, `respondedAt`)
VALUES
  (1, 1,    1, 1, 2, 5, 'ACCEPTED', 'Please ride Demo Thunder in the Future Championship.', DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_ADD(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY)),
  (2, 2,    1, 2, 2, 6, 'PENDING',  'Invitation to partner with Demo Comet.',                 DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 7 DAY), NULL),
  (3, NULL, 1, 7, 4, 7, 'PENDING',  'Invitation to partner with Demo Aurora.',                DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_ADD(@seed_now, INTERVAL 7 DAY), NULL);

COMMIT;

-- Verification summary. Each value should match SEED_EXECUTION_ORDER.md.
SELECT 'Roles' AS `tableName`, COUNT(*) AS `rowCount` FROM `Roles`
UNION ALL SELECT 'Users', COUNT(*) FROM `Users`
UNION ALL SELECT 'JockeyProfile', COUNT(*) FROM `JockeyProfile`
UNION ALL SELECT 'Horse', COUNT(*) FROM `Horse`
UNION ALL SELECT 'Tournament', COUNT(*) FROM `Tournament`
UNION ALL SELECT 'TournamentCondition', COUNT(*) FROM `TournamentCondition`
UNION ALL SELECT 'Race', COUNT(*) FROM `Race`
UNION ALL SELECT 'RacePrize', COUNT(*) FROM `RacePrize`
UNION ALL SELECT 'Registration', COUNT(*) FROM `Registration`
UNION ALL SELECT 'RaceEntry', COUNT(*) FROM `RaceEntry`
UNION ALL SELECT 'RefereeAssignment', COUNT(*) FROM `RefereeAssignment`
UNION ALL SELECT 'JockeyInvitation', COUNT(*) FROM `JockeyInvitation`;
