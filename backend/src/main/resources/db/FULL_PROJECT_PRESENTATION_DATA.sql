USE `horse_racing_system`;

-- Full project presentation data.
-- Run once immediately after team_schema.sql on a fresh database.
-- Login password for every seeded account: 123456
--
-- Scenario goal:
-- - 2 Tournaments.
-- - Each Tournament has 2 Races.
-- - Race 1 has 2 assigned RaceEntry rows.
-- - Race 3 has 5 assigned RaceEntry rows.
-- - Every RaceEntry uses a different Owner + Horse + Jockey combination.
-- - No RefereeAssignment rows are seeded yet.
-- - No BetProduct, BetEvent, BetTicket, or BetSettlement rows are seeded yet.
--
-- Suggested demo path:
-- 1. Admin opens Tournament Workspace and sees two clean Tournaments.
-- 2. Admin can inspect Race 1 with 2 entries and Race 3 with 5 entries.
-- 3. Admin can assign Referee manually because no RefereeAssignment exists.
-- 4. Betting setup can be created later from the UI because no BetEvent exists.

SET @seed_now = NOW();
SET @seed_today = CURDATE();
SET @seed_password = '$2a$10$Ieulp7E7sedpTVjs0DGXfu2/Tv74cxORzfH0ZuOgr.DRNPsc5o1te';

START TRANSACTION;

INSERT INTO `Users`
  (`userID`, `roleID`, `accountType`, `username`, `email`, `password`, `phone`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1,  1, 'ADMIN',     'admin',          'admin@gmail.com',          @seed_password, '0900000001', 'ACTIVE', @seed_now, @seed_now),
  (2,  2, 'OWNER',     'ownerhuy',       'ownerhuy@gmail.com',       @seed_password, '0900000002', 'ACTIVE', @seed_now, @seed_now),
  (3,  2, 'OWNER',     'ownerkhoa',      'ownerkhoa@gmail.com',      @seed_password, '0900000003', 'ACTIVE', @seed_now, @seed_now),
  (4,  2, 'OWNER',     'ownerminh',      'ownerminh@gmail.com',      @seed_password, '0900000004', 'ACTIVE', @seed_now, @seed_now),
  (5,  2, 'OWNER',     'ownerbao',       'ownerbao@gmail.com',       @seed_password, '0900000005', 'ACTIVE', @seed_now, @seed_now),
  (6,  2, 'OWNER',     'ownerlinh',      'ownerlinh@gmail.com',      @seed_password, '0900000006', 'ACTIVE', @seed_now, @seed_now),
  (7,  2, 'OWNER',     'owneran',        'owneran@gmail.com',        @seed_password, '0900000007', 'ACTIVE', @seed_now, @seed_now),
  (8,  2, 'OWNER',     'ownermai',       'ownermai@gmail.com',       @seed_password, '0900000008', 'ACTIVE', @seed_now, @seed_now),
  (9,  3, 'JOCKEY',    'jockeynam',      'jockeynam@gmail.com',      @seed_password, '0900000009', 'ACTIVE', @seed_now, @seed_now),
  (10, 3, 'JOCKEY',    'jockeybao',      'jockeybao@gmail.com',      @seed_password, '0900000010', 'ACTIVE', @seed_now, @seed_now),
  (11, 3, 'JOCKEY',    'jockeyminh',     'jockeyminh@gmail.com',     @seed_password, '0900000011', 'ACTIVE', @seed_now, @seed_now),
  (12, 3, 'JOCKEY',    'jockeyha',       'jockeyha@gmail.com',       @seed_password, '0900000012', 'ACTIVE', @seed_now, @seed_now),
  (13, 3, 'JOCKEY',    'jockeylan',      'jockeylan@gmail.com',      @seed_password, '0900000013', 'ACTIVE', @seed_now, @seed_now),
  (14, 3, 'JOCKEY',    'jockeyphuc',     'jockeyphuc@gmail.com',     @seed_password, '0900000014', 'ACTIVE', @seed_now, @seed_now),
  (15, 3, 'JOCKEY',    'jockeythao',     'jockeythao@gmail.com',     @seed_password, '0900000015', 'ACTIVE', @seed_now, @seed_now),
  (16, 4, 'REFEREE',   'refereegrace',   'refereegrace@gmail.com',   @seed_password, '0900000016', 'ACTIVE', @seed_now, @seed_now),
  (17, 4, 'REFEREE',   'refereehenry',   'refereehenry@gmail.com',   @seed_password, '0900000017', 'ACTIVE', @seed_now, @seed_now),
  (18, 5, 'SPECTATOR', 'spectatorhuy',   'spectatorhuy@gmail.com',   @seed_password, '0900000018', 'ACTIVE', @seed_now, @seed_now);

INSERT INTO `OwnerApplication`
  (`applicationID`, `userID`, `stableName`, `stableAddress`, `stableCertificateUrl`, `totalHorsesOwned`, `horseOwnershipProofUrl`, `status`, `rejectReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 2, 'Huy Racing Stable',  'Bangkok Riverside Stable',  'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/huy-stable-certificate.pdf',  1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/huy-horse-proof.pdf',  'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (2, 3, 'Khoa Racing Stable', 'Chiang Mai Elite Stable',   'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/khoa-stable-certificate.pdf', 1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/khoa-horse-proof.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (3, 4, 'Minh Racing Stable', 'Bangkok Victory Stable',    'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/minh-stable-certificate.pdf', 1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/minh-horse-proof.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (4, 5, 'Bao Racing Stable',  'Pattaya Coast Stable',      'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/bao-stable-certificate.pdf',  1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/bao-horse-proof.pdf',  'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (5, 6, 'Linh Racing Stable', 'Bangkok North Stable',      'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/linh-stable-certificate.pdf', 1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/linh-horse-proof.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (6, 7, 'An Racing Stable',   'Chiang Mai Valley Stable',  'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/an-stable-certificate.pdf',   1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/an-horse-proof.pdf',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (7, 8, 'Mai Racing Stable',  'Bangkok Central Stable',    'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/mai-stable-certificate.pdf',  1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/mai-horse-proof.pdf',  'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now);

INSERT INTO `OwnerProfile`
  (`ownerID`, `applicationID`, `createdAt`, `updatedAt`)
VALUES
  (2, 1, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (3, 2, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (4, 3, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (5, 4, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (6, 5, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (7, 6, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (8, 7, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now);

INSERT INTO `JockeyProfile`
  (`jockeyID`, `fullName`, `weight`, `biography`, `totalRaces`, `totalWins`, `createdAt`, `updatedAt`)
VALUES
  (9,  'Jockey Nam',  52.50, 'Sprint-focused professional jockey.',       12, 4, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (10, 'Jockey Bao',  54.00, 'Middle-distance professional jockey.',       10, 3, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (11, 'Jockey Minh', 53.00, 'Consistent tactical jockey.',                 8, 2, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (12, 'Jockey Ha',   51.80, 'Lightweight jockey for fast starts.',         7, 2, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (13, 'Jockey Lan',  52.20, 'Experienced race finisher.',                  9, 3, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (14, 'Jockey Phuc', 55.00, 'Strong rider for longer tracks.',             6, 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (15, 'Jockey Thao', 53.60, 'Balanced jockey with clean race history.',     5, 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now);

INSERT INTO `JockeyVerification`
  (`verificationID`, `jockeyID`, `trainerName`, `trainerEmail`, `academyStableAddress`, `issuingAuthority`, `verificationLink`, `licenceType`, `expiryDate`, `weight`, `biography`, `verificationStatus`, `rejectionReason`, `resubmitCount`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 9,  'Trainer An',   'trainer.an@gmail.com',   'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-nam-license.pdf',  'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.50, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (2, 10, 'Trainer Binh', 'trainer.binh@gmail.com', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-bao-license.pdf',  'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 54.00, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (3, 11, 'Trainer Minh', 'trainer.minh@gmail.com', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-minh-license.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.00, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (4, 12, 'Trainer Ha',   'trainer.ha@gmail.com',   'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-ha-license.pdf',   'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 51.80, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (5, 13, 'Trainer Lan',  'trainer.lan@gmail.com',  'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-lan-license.pdf',  'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.20, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (6, 14, 'Trainer Phuc', 'trainer.phuc@gmail.com', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-phuc-license.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 55.00, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (7, 15, 'Trainer Thao', 'trainer.thao@gmail.com', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-thao-license.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.60, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now);

INSERT INTO `Horse`
  (`horseID`, `ownerID`, `horseName`, `age`, `dayOfBirth`, `weight`, `colour`, `sex`, `breeding`, `trainer`, `healthCertExpiry`, `healthCertificateUrl`, `officialHorseProfileUrl`, `status`, `rejectionReason`, `createdAt`, `updatedAt`)
VALUES
  (1, 2, 'Saigon Thunder', 4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 480.00, 'Bay',      'MALE',   'Thoroughbred', 'Trainer An',   DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/saigon-thunder-health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/saigon-thunder', 'ACTIVE', NULL, @seed_now, @seed_now),
  (2, 3, 'Mekong Blaze',   5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 496.00, 'Chestnut', 'MALE',   'Thoroughbred', 'Trainer Binh', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/mekong-blaze-health.pdf',   'https://www.racingandsports.com.au/thoroughbred/horse/mekong-blaze',   'ACTIVE', NULL, @seed_now, @seed_now),
  (3, 4, 'Minh Comet',     4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 502.00, 'Black',    'MALE',   'Thoroughbred', 'Trainer Minh', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/minh-comet-health.pdf',     'https://www.racingandsports.com.au/thoroughbred/horse/minh-comet',     'ACTIVE', NULL, @seed_now, @seed_now),
  (4, 5, 'Bangkok Arrow',  6, DATE_SUB(@seed_today, INTERVAL 6 YEAR), 510.00, 'Grey',     'FEMALE', 'Thoroughbred', 'Trainer Bao',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/bangkok-arrow-health.pdf',  'https://www.racingandsports.com.au/thoroughbred/horse/bangkok-arrow',  'ACTIVE', NULL, @seed_now, @seed_now),
  (5, 6, 'Golden Lotus',   5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 488.00, 'Bay',      'FEMALE', 'Thoroughbred', 'Trainer Linh', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/golden-lotus-health.pdf',   'https://www.racingandsports.com.au/thoroughbred/horse/golden-lotus',   'ACTIVE', NULL, @seed_now, @seed_now),
  (6, 7, 'Chiang Star',    4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 475.00, 'Brown',    'MALE',   'Thoroughbred', 'Trainer An',   DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/chiang-star-health.pdf',    'https://www.racingandsports.com.au/thoroughbred/horse/chiang-star',    'ACTIVE', NULL, @seed_now, @seed_now),
  (7, 8, 'River Orchid',   5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 492.00, 'Chestnut', 'FEMALE', 'Thoroughbred', 'Trainer Mai',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/river-orchid-health.pdf',   'https://www.racingandsports.com.au/thoroughbred/horse/river-orchid',   'ACTIVE', NULL, @seed_now, @seed_now);

INSERT INTO `Tournament`
  (`tournamentID`, `tournamentName`, `venue`, `venueImageUrl`, `description`, `registrationOpenAt`, `registrationCloseAt`, `startDate`, `endDate`, `maxRegistrations`, `entryFee`, `status`, `createdBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 'Bangkok Future Championship', 'Bangkok Equestrian Park', 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80', 'Presentation tournament with one two-entry race and one empty race for setup demonstration.', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_today, INTERVAL 5 DAY), DATE_ADD(@seed_today, INTERVAL 7 DAY), 24, 1000000.00, 'OPEN_FOR_REGISTRATION', 1, @seed_now, @seed_now),
  (2, 'Chiang Mai Heritage Cup', 'Chiang Mai Main Track', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 'Presentation tournament with one five-entry race and one empty race for betting/referee setup later.', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 6 DAY), DATE_ADD(@seed_today, INTERVAL 12 DAY), DATE_ADD(@seed_today, INTERVAL 14 DAY), 24, 1000000.00, 'OPEN_FOR_REGISTRATION', 1, @seed_now, @seed_now);

INSERT INTO `TournamentCondition`
  (`conditionID`, `tournamentID`, `conditionType`, `operator`, `minValue`, `maxValue`, `value`)
VALUES
  (1, 1, 'AGE',    'BETWEEN', 3.00, 10.00, NULL),
  (2, 1, 'WEIGHT', 'LTE',     NULL, NULL, '560'),
  (3, 2, 'AGE',    'BETWEEN', 3.00, 10.00, NULL),
  (4, 2, 'WEIGHT', 'LTE',     NULL, NULL, '560');

INSERT INTO `Race`
  (`raceID`, `tournamentID`, `raceName`, `trackName`, `trackImageUrl`, `raceStartTime`, `raceEndTime`, `entryFinalizationScheduledAt`, `entryFinalizedAt`, `entryFinalizedBy`, `distance`, `maxRunners`, `raceOrder`, `status`, `runTriggeredBy`, `runStartedAt`, `raceEngineToken`, `raceEngineTokenIssuedAt`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 'Bangkok Sprint',       'Bangkok Track A',   'https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 5 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 5 DAY), '11:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 2 DAY), '09:00:00'), NULL, NULL, 1200, 6, 1, 'REGISTRATION_CLOSED', NULL, NULL, NULL, NULL, @seed_now, @seed_now),
  (2, 1, 'Bangkok Classic',      'Bangkok Track B',   'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 6 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 6 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 3 DAY), '09:00:00'), NULL, NULL, 1600, 6, 2, 'OPEN_FOR_REGISTRATION', NULL, NULL, NULL, NULL, @seed_now, @seed_now),
  (3, 2, 'Chiang Mai Sprint',    'Chiang Mai Main',   'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 12 DAY), '09:30:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 12 DAY), '10:30:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 9 DAY), '09:00:00'), NULL, NULL, 1200, 6, 1, 'REGISTRATION_CLOSED', NULL, NULL, NULL, NULL, @seed_now, @seed_now),
  (4, 2, 'Chiang Mai Endurance', 'Chiang Mai Valley', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 13 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 13 DAY), '16:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 10 DAY), '09:00:00'), NULL, NULL, 2000, 6, 2, 'OPEN_FOR_REGISTRATION', NULL, NULL, NULL, NULL, @seed_now, @seed_now);

INSERT INTO `RacePrize`
  (`racePrizeID`, `raceID`, `rankPosition`, `amount`, `ownerPercent`, `jockeyPercent`)
VALUES
  (1,  1, 1, 20000000.00, 80.00, 20.00),
  (2,  1, 2, 12000000.00, 80.00, 20.00),
  (3,  1, 3,  8000000.00, 80.00, 20.00),
  (4,  2, 1, 18000000.00, 80.00, 20.00),
  (5,  2, 2, 10000000.00, 80.00, 20.00),
  (6,  2, 3,  6000000.00, 80.00, 20.00),
  (7,  3, 1, 22000000.00, 80.00, 20.00),
  (8,  3, 2, 14000000.00, 80.00, 20.00),
  (9,  3, 3,  9000000.00, 80.00, 20.00),
  (10, 4, 1, 24000000.00, 80.00, 20.00),
  (11, 4, 2, 15000000.00, 80.00, 20.00),
  (12, 4, 3, 10000000.00, 80.00, 20.00);

INSERT INTO `Registration`
  (`registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `registrationNo`, `paymentStatus`, `approvalStatus`, `rejectionReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 1, 2,  9, 'REG-FULL-001', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (2, 1, 2, 3, 10, 'REG-FULL-002', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (3, 2, 3, 4, 11, 'REG-FULL-003', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (4, 2, 4, 5, 12, 'REG-FULL-004', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (5, 2, 5, 6, 13, 'REG-FULL-005', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (6, 2, 6, 7, 14, 'REG-FULL-006', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (7, 2, 7, 8, 15, 'REG-FULL-007', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now);

INSERT INTO `JockeyInvitation`
  (`invitationID`, `registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `status`, `message`, `createdAt`, `expiredAt`, `respondedAt`)
VALUES
  (1, 1, 1, 1, 2,  9, 'ACCEPTED', 'Accepted invitation for Bangkok Sprint.',    DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (2, 2, 1, 2, 3, 10, 'ACCEPTED', 'Accepted invitation for Bangkok Sprint.',    DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (3, 3, 2, 3, 4, 11, 'ACCEPTED', 'Accepted invitation for Chiang Mai Sprint.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (4, 4, 2, 4, 5, 12, 'ACCEPTED', 'Accepted invitation for Chiang Mai Sprint.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (5, 5, 2, 5, 6, 13, 'ACCEPTED', 'Accepted invitation for Chiang Mai Sprint.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (6, 6, 2, 6, 7, 14, 'ACCEPTED', 'Accepted invitation for Chiang Mai Sprint.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (7, 7, 2, 7, 8, 15, 'ACCEPTED', 'Accepted invitation for Chiang Mai Sprint.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY));

INSERT INTO `PaymentTransaction`
  (`paymentTransactionID`, `userID`, `registrationID`, `walletID`, `purpose`, `provider`, `amount`, `currency`, `txnRef`, `providerTransactionNo`, `status`, `payUrl`, `responseCode`, `rawResponse`, `createdAt`, `paidAt`, `updatedAt`)
VALUES
  (1, 2, 1, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-001', 'VNP-FULL-001', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=1', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (2, 3, 2, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-002', 'VNP-FULL-002', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=2', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (3, 4, 3, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-003', 'VNP-FULL-003', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=3', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (4, 5, 4, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-004', 'VNP-FULL-004', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=4', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (5, 6, 5, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-005', 'VNP-FULL-005', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=5', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (6, 7, 6, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-006', 'VNP-FULL-006', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=6', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (7, 8, 7, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-007', 'VNP-FULL-007', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=7', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now);

INSERT INTO `TournamentFund`
  (`tournamentID`, `collectedAmount`, `paidPrizeAmount`, `availableBalance`, `createdAt`, `updatedAt`)
VALUES
  (1, 2000000.00, 0.00, 2000000.00, @seed_now, @seed_now),
  (2, 5000000.00, 0.00, 5000000.00, @seed_now, @seed_now);

INSERT INTO `SystemFund`
  (`systemFundID`, `balance`, `bettingFeeRevenue`, `createdAt`, `updatedAt`)
VALUES
  (1, 0.00, 0.00, @seed_now, @seed_now);

INSERT INTO `FundTransaction`
  (`fundTransactionID`, `fundKey`, `tournamentID`, `transactionType`, `direction`, `amount`, `balanceBefore`, `balanceAfter`, `referenceType`, `referenceID`, `description`, `createdAt`)
VALUES
  (1, 'TOURNAMENT:1', 1, 'REGISTRATION_FEE', 'CREDIT', 1000000.00,       0.00, 1000000.00, 'PAYMENT_TRANSACTION', 1, 'Tournament registration fee REG-FULL-001', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (2, 'TOURNAMENT:1', 1, 'REGISTRATION_FEE', 'CREDIT', 1000000.00, 1000000.00, 2000000.00, 'PAYMENT_TRANSACTION', 2, 'Tournament registration fee REG-FULL-002', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (3, 'TOURNAMENT:2', 2, 'REGISTRATION_FEE', 'CREDIT', 1000000.00,       0.00, 1000000.00, 'PAYMENT_TRANSACTION', 3, 'Tournament registration fee REG-FULL-003', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (4, 'TOURNAMENT:2', 2, 'REGISTRATION_FEE', 'CREDIT', 1000000.00, 1000000.00, 2000000.00, 'PAYMENT_TRANSACTION', 4, 'Tournament registration fee REG-FULL-004', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (5, 'TOURNAMENT:2', 2, 'REGISTRATION_FEE', 'CREDIT', 1000000.00, 2000000.00, 3000000.00, 'PAYMENT_TRANSACTION', 5, 'Tournament registration fee REG-FULL-005', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (6, 'TOURNAMENT:2', 2, 'REGISTRATION_FEE', 'CREDIT', 1000000.00, 3000000.00, 4000000.00, 'PAYMENT_TRANSACTION', 6, 'Tournament registration fee REG-FULL-006', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (7, 'TOURNAMENT:2', 2, 'REGISTRATION_FEE', 'CREDIT', 1000000.00, 4000000.00, 5000000.00, 'PAYMENT_TRANSACTION', 7, 'Tournament registration fee REG-FULL-007', DATE_SUB(@seed_now, INTERVAL 2 DAY));

INSERT INTO `RaceEntry`
  (`raceEntryID`, `raceID`, `registrationID`, `startingStall`, `status`, `assignedAt`, `assignedBy`, `cancelledAt`, `cancelledBy`, `cancellationReason`)
VALUES
  (1, 1, 1, 1, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (2, 1, 2, 2, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (3, 3, 3, 1, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (4, 3, 4, 2, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (5, 3, 5, 3, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (6, 3, 6, 4, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (7, 3, 7, 5, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL);

-- Intentionally omitted:
-- - RefereeAssignment
-- - BetProduct
-- - BetEvent
-- - BetTicket
-- - BetSettlement
-- - RaceResultSubmission
-- - RaceResult
-- - PrizeDistribution

COMMIT;

SELECT 'Users' AS `tableName`, COUNT(*) AS `rowCount` FROM `Users`
UNION ALL SELECT 'OwnerApplication', COUNT(*) FROM `OwnerApplication`
UNION ALL SELECT 'OwnerProfile', COUNT(*) FROM `OwnerProfile`
UNION ALL SELECT 'JockeyProfile', COUNT(*) FROM `JockeyProfile`
UNION ALL SELECT 'JockeyVerification', COUNT(*) FROM `JockeyVerification`
UNION ALL SELECT 'Horse', COUNT(*) FROM `Horse`
UNION ALL SELECT 'Tournament', COUNT(*) FROM `Tournament`
UNION ALL SELECT 'TournamentCondition', COUNT(*) FROM `TournamentCondition`
UNION ALL SELECT 'Race', COUNT(*) FROM `Race`
UNION ALL SELECT 'RacePrize', COUNT(*) FROM `RacePrize`
UNION ALL SELECT 'Registration', COUNT(*) FROM `Registration`
UNION ALL SELECT 'JockeyInvitation', COUNT(*) FROM `JockeyInvitation`
UNION ALL SELECT 'PaymentTransaction', COUNT(*) FROM `PaymentTransaction`
UNION ALL SELECT 'TournamentFund', COUNT(*) FROM `TournamentFund`
UNION ALL SELECT 'SystemFund', COUNT(*) FROM `SystemFund`
UNION ALL SELECT 'FundTransaction', COUNT(*) FROM `FundTransaction`
UNION ALL SELECT 'RaceEntry', COUNT(*) FROM `RaceEntry`
UNION ALL SELECT 'RefereeAssignment', COUNT(*) FROM `RefereeAssignment`
UNION ALL SELECT 'BetProduct', COUNT(*) FROM `BetProduct`
UNION ALL SELECT 'BetEvent', COUNT(*) FROM `BetEvent`
UNION ALL SELECT 'BetTicket', COUNT(*) FROM `BetTicket`
UNION ALL SELECT 'RaceResultSubmission', COUNT(*) FROM `RaceResultSubmission`
UNION ALL SELECT 'RaceResult', COUNT(*) FROM `RaceResult`
UNION ALL SELECT 'PrizeDistribution', COUNT(*) FROM `PrizeDistribution`;
