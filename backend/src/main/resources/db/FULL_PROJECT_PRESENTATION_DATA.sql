USE `horse_racing_system`;

-- Full project presentation data.
-- Run after team_schema.sql. This script resets project data before inserting the demo scenario.
-- Login password for every seeded account: 123456
--
-- Scenario goal:
-- - 2 Tournaments.
-- - Each Tournament has 2 Races.
-- - In each Tournament:
--   - Race 1 has 3 assigned RaceEntry rows.
--   - Race 2 has 5 assigned RaceEntry rows.
-- - Races stay REGISTRATION_CLOSED on purpose so the demo can still assign Referee,
--   finalize RaceEntry, fast-forward demo time, mark READY, launch Unity, and review results.
-- - Every RaceEntry uses a unique Owner + Horse + Jockey identity.
-- - Every APPROVED Registration is PAID and has a SUCCESS PaymentTransaction.
-- - Tournament registration fee payment is recorded by PaymentTransaction only.
-- - No RefereeAssignment rows are seeded yet.
-- - BetProduct rows are seeded so Admin can create BetEvent from the UI.
-- - No BetEvent, BetTicket, or BetSettlement rows are seeded yet.

SET @seed_now = NOW();
SET @seed_today = CURDATE();
SET @seed_password = '$2a$10$Ieulp7E7sedpTVjs0DGXfu2/Tv74cxORzfH0ZuOgr.DRNPsc5o1te';

START TRANSACTION;

SET @old_foreign_key_checks = @@FOREIGN_KEY_CHECKS;
SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

DELETE FROM `JockeyInvitation`;
DELETE FROM `RefereeAssignment`;
DELETE FROM `JockeyPerformanceSummary`;
DELETE FROM `HorsePerformanceSummary`;
DELETE FROM `PrizeDistribution`;
DELETE FROM `BetSettlement`;
DELETE FROM `BetTicket`;
DELETE FROM `BetEvent`;
DELETE FROM `BetProduct`;
DELETE FROM `Bet`;
DELETE FROM `FundTransaction`;
DELETE FROM `SystemFund`;
DELETE FROM `WalletTransaction`;
DELETE FROM `RaceResultReviewAction`;
DELETE FROM `RaceResultSubmissionEntry`;
DELETE FROM `RaceResultSubmission`;
DELETE FROM `RaceResult`;
DELETE FROM `RaceEntry`;
DELETE FROM `PaymentTransaction`;
DELETE FROM `Wallet`;
DELETE FROM `didit_webhook_events`;
DELETE FROM `user_verifications`;
DELETE FROM `Registration`;
DELETE FROM `RacePrize`;
DELETE FROM `Race`;
DELETE FROM `TournamentCondition`;
DELETE FROM `Tournament`;
DELETE FROM `JockeyVerificationFile`;
DELETE FROM `JockeyVerification`;
DELETE FROM `JockeyProfile`;
DELETE FROM `Horse`;
DELETE FROM `OwnerProfile`;
DELETE FROM `OwnerApplication`;
DELETE FROM `Users`;
DELETE FROM `Roles`;

SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
SET FOREIGN_KEY_CHECKS = @old_foreign_key_checks;

INSERT INTO `Roles` (`roleID`, `roleName`)
VALUES
  (1, 'ADMIN'),
  (2, 'OWNER'),
  (3, 'JOCKEY'),
  (4, 'REFEREE'),
  (5, 'SPECTATOR');

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
  (9,  2, 'OWNER',     'ownerphong',     'ownerphong@gmail.com',     @seed_password, '0900000009', 'ACTIVE', @seed_now, @seed_now),
  (10, 2, 'OWNER',     'ownertrang',     'ownertrang@gmail.com',     @seed_password, '0900000010', 'ACTIVE', @seed_now, @seed_now),
  (11, 2, 'OWNER',     'ownerviet',      'ownerviet@gmail.com',      @seed_password, '0900000011', 'ACTIVE', @seed_now, @seed_now),
  (12, 2, 'OWNER',     'ownerlam',       'ownerlam@gmail.com',       @seed_password, '0900000012', 'ACTIVE', @seed_now, @seed_now),
  (13, 2, 'OWNER',     'ownerhoa',       'ownerhoa@gmail.com',       @seed_password, '0900000013', 'ACTIVE', @seed_now, @seed_now),
  (14, 2, 'OWNER',     'ownerson',       'ownerson@gmail.com',       @seed_password, '0900000014', 'ACTIVE', @seed_now, @seed_now),
  (15, 2, 'OWNER',     'ownernam',       'ownernam@gmail.com',       @seed_password, '0900000015', 'ACTIVE', @seed_now, @seed_now),
  (16, 2, 'OWNER',     'ownerha',        'ownerha@gmail.com',        @seed_password, '0900000016', 'ACTIVE', @seed_now, @seed_now),
  (17, 2, 'OWNER',     'ownerngoc',      'ownerngoc@gmail.com',      @seed_password, '0900000017', 'ACTIVE', @seed_now, @seed_now),
  (18, 3, 'JOCKEY',    'jockeynam',      'jockeynam@gmail.com',      @seed_password, '0900000018', 'ACTIVE', @seed_now, @seed_now),
  (19, 3, 'JOCKEY',    'jockeybao',      'jockeybao@gmail.com',      @seed_password, '0900000019', 'ACTIVE', @seed_now, @seed_now),
  (20, 3, 'JOCKEY',    'jockeyminh',     'jockeyminh@gmail.com',     @seed_password, '0900000020', 'ACTIVE', @seed_now, @seed_now),
  (21, 3, 'JOCKEY',    'jockeyha',       'jockeyha@gmail.com',       @seed_password, '0900000021', 'ACTIVE', @seed_now, @seed_now),
  (22, 3, 'JOCKEY',    'jockeylan',      'jockeylan@gmail.com',      @seed_password, '0900000022', 'ACTIVE', @seed_now, @seed_now),
  (23, 3, 'JOCKEY',    'jockeyphuc',     'jockeyphuc@gmail.com',     @seed_password, '0900000023', 'ACTIVE', @seed_now, @seed_now),
  (24, 3, 'JOCKEY',    'jockeythao',     'jockeythao@gmail.com',     @seed_password, '0900000024', 'ACTIVE', @seed_now, @seed_now),
  (25, 3, 'JOCKEY',    'jockeytuan',     'jockeytuan@gmail.com',     @seed_password, '0900000025', 'ACTIVE', @seed_now, @seed_now),
  (26, 3, 'JOCKEY',    'jockeylong',     'jockeylong@gmail.com',     @seed_password, '0900000026', 'ACTIVE', @seed_now, @seed_now),
  (27, 3, 'JOCKEY',    'jockeydat',      'jockeydat@gmail.com',      @seed_password, '0900000027', 'ACTIVE', @seed_now, @seed_now),
  (28, 3, 'JOCKEY',    'jockeyquang',    'jockeyquang@gmail.com',    @seed_password, '0900000028', 'ACTIVE', @seed_now, @seed_now),
  (29, 3, 'JOCKEY',    'jockeyduy',      'jockeyduy@gmail.com',      @seed_password, '0900000029', 'ACTIVE', @seed_now, @seed_now),
  (30, 3, 'JOCKEY',    'jockeyson',      'jockeyson@gmail.com',      @seed_password, '0900000030', 'ACTIVE', @seed_now, @seed_now),
  (31, 3, 'JOCKEY',    'jockeytrung',    'jockeytrung@gmail.com',    @seed_password, '0900000031', 'ACTIVE', @seed_now, @seed_now),
  (32, 3, 'JOCKEY',    'jockeykiet',     'jockeykiet@gmail.com',     @seed_password, '0900000032', 'ACTIVE', @seed_now, @seed_now),
  (33, 3, 'JOCKEY',    'jockeyvinh',     'jockeyvinh@gmail.com',     @seed_password, '0900000033', 'ACTIVE', @seed_now, @seed_now),
  (34, 4, 'REFEREE',   'refereegrace',   'refereegrace@gmail.com',   @seed_password, '0900000034', 'ACTIVE', @seed_now, @seed_now),
  (35, 4, 'REFEREE',   'refereehenry',   'refereehenry@gmail.com',   @seed_password, '0900000035', 'ACTIVE', @seed_now, @seed_now),
  (36, 5, 'SPECTATOR', 'spectatorhuy',   'spectatorhuy@gmail.com',   @seed_password, '0900000036', 'ACTIVE', @seed_now, @seed_now),
  (37, 2, 'OWNER',     'owner',          'owner@gmail.com',          @seed_password, '0900000037', 'ACTIVE', @seed_now, @seed_now),
  (38, 3, 'JOCKEY',    'jockey',         'jockey@gmail.com',         @seed_password, '0900000038', 'ACTIVE', @seed_now, @seed_now),
  (39, 5, 'SPECTATOR', 'spectator',      'spectator@gmail.com',      @seed_password, '0900000039', 'ACTIVE', @seed_now, @seed_now),
  (40, 5, 'SPECTATOR', 'spectator1',     'spectator1@gmail.com',     @seed_password, '0900000040', 'ACTIVE', @seed_now, @seed_now),
  (41, 5, 'SPECTATOR', 'spectator2',     'spectator2@gmail.com',     @seed_password, '0900000041', 'ACTIVE', @seed_now, @seed_now);

INSERT INTO `user_verifications`
  (`verification_id`, `user_id`, `provider`, `provider_session_id`, `provider_session_number`, `workflow_id`, `vendor_data`, `verification_url`, `status`, `id_verification_status`, `liveness_status`, `face_match_status`, `verified_full_name`, `verified_date_of_birth`, `document_type`, `document_last_four`, `attempt_number`, `submitted_at`, `verified_at`, `expires_at`, `created_at`, `updated_at`)
VALUES
  (1, 39, 'DIDIT', 'presentation-didit-39', 39, 'presentation-workflow', 'user-39', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Presentation Spectator', DATE_SUB(@seed_today, INTERVAL 25 YEAR), 'ID_CARD', '0039', 1, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (2, 40, 'DIDIT', 'presentation-didit-40', 40, 'presentation-workflow', 'user-40', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Presentation Spectator One', DATE_SUB(@seed_today, INTERVAL 24 YEAR), 'ID_CARD', '0040', 1, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (3, 41, 'DIDIT', 'presentation-didit-41', 41, 'presentation-workflow', 'user-41', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Presentation Spectator Two', DATE_SUB(@seed_today, INTERVAL 23 YEAR), 'ID_CARD', '0041', 1, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY));

INSERT INTO `OwnerApplication`
  (`applicationID`, `userID`, `stableName`, `stableAddress`, `stableCertificateUrl`, `totalHorsesOwned`, `horseOwnershipProofUrl`, `status`, `rejectReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1,  2, 'Huy Racing Stable',    'Bangkok Riverside Stable', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-huy-certificate.pdf',    1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-huy-proof.pdf',    'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (2,  3, 'Khoa Racing Stable',   'Bangkok Elite Stable',     'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-khoa-certificate.pdf',   1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-khoa-proof.pdf',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (3,  4, 'Minh Racing Stable',   'Bangkok Victory Stable',   'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-minh-certificate.pdf',   1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-minh-proof.pdf',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (4,  5, 'Bao Racing Stable',    'Bangkok Coast Stable',     'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-bao-certificate.pdf',    1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-bao-proof.pdf',    'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (5,  6, 'Linh Racing Stable',   'Bangkok North Stable',     'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-linh-certificate.pdf',   1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-linh-proof.pdf',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (6,  7, 'An Racing Stable',     'Bangkok Valley Stable',    'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-an-certificate.pdf',     1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-an-proof.pdf',     'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (7,  8, 'Mai Racing Stable',    'Bangkok Central Stable',   'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-mai-certificate.pdf',    1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-mai-proof.pdf',    'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (8,  9, 'Phong Racing Stable',  'Bangkok East Stable',      'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-phong-certificate.pdf',  1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-phong-proof.pdf',  'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (9,  10, 'Trang Racing Stable', 'Chiang Mai Riverside',     'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-trang-certificate.pdf', 1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-trang-proof.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (10, 11, 'Viet Racing Stable',  'Chiang Mai Elite Stable',  'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-viet-certificate.pdf',  1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-viet-proof.pdf',  'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (11, 12, 'Lam Racing Stable',   'Chiang Mai Hill Stable',   'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-lam-certificate.pdf',   1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-lam-proof.pdf',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (12, 13, 'Hoa Racing Stable',   'Chiang Mai North Stable',  'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-hoa-certificate.pdf',   1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-hoa-proof.pdf',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (13, 14, 'Son Racing Stable',   'Chiang Mai South Stable',  'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-son-certificate.pdf',   1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-son-proof.pdf',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (14, 15, 'Nam Racing Stable',   'Chiang Mai West Stable',   'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-nam-certificate.pdf',   1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-nam-proof.pdf',   'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (15, 16, 'Ha Racing Stable',    'Chiang Mai Central Stable','https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-ha-certificate.pdf',    1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-ha-proof.pdf',    'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (16, 17, 'Ngoc Racing Stable',  'Chiang Mai East Stable',   'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-ngoc-certificate.pdf',  1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-ngoc-proof.pdf',  'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (17, 37, 'Victory Racetrack Stable', 'Bangkok Presentation Stable', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-practice-certificate.pdf', 2, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/owner-practice-proof.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 29 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now);

INSERT INTO `OwnerProfile` (`ownerID`, `applicationID`, `createdAt`, `updatedAt`)
VALUES
  (2, 1, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (3, 2, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (4, 3, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (5, 4, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (6, 5, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (7, 6, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (8, 7, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (9, 8, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (10, 9, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (11, 10, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (12, 11, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (13, 12, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (14, 13, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (15, 14, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (16, 15, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (17, 16, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now),
  (37, 17, DATE_SUB(@seed_now, INTERVAL 29 DAY), @seed_now);

INSERT INTO `JockeyProfile`
  (`jockeyID`, `fullName`, `weight`, `biography`, `totalRaces`, `totalWins`, `createdAt`, `updatedAt`)
VALUES
  (18, 'Jockey Nam',   52.50, 'Sprint-focused professional jockey.',         12, 4, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (19, 'Jockey Bao',   54.00, 'Middle-distance professional jockey.',         10, 3, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (20, 'Jockey Minh',  53.00, 'Consistent tactical jockey.',                   8, 2, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (21, 'Jockey Ha',    51.80, 'Lightweight jockey for fast starts.',           7, 2, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (22, 'Jockey Lan',   52.20, 'Experienced race finisher.',                    9, 3, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (23, 'Jockey Phuc',  55.00, 'Strong rider for longer tracks.',               6, 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (24, 'Jockey Thao',  53.60, 'Balanced jockey with clean race history.',       5, 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (25, 'Jockey Tuan',  54.40, 'Calm jockey for crowded fields.',               6, 2, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (26, 'Jockey Long',  52.90, 'Fast reaction jockey for sprint races.',         7, 2, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (27, 'Jockey Dat',   53.30, 'Reliable jockey for technical tracks.',          6, 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (28, 'Jockey Quang', 54.10, 'Strong finisher for late surges.',               8, 3, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (29, 'Jockey Duy',   52.70, 'Efficient jockey with disciplined pacing.',      5, 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (30, 'Jockey Son',   55.20, 'Experienced jockey for long races.',             9, 2, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (31, 'Jockey Trung', 53.90, 'Stable performer on mixed surfaces.',            6, 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (32, 'Jockey Kiet',  52.40, 'Lightweight tactical jockey.',                   5, 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (33, 'Jockey Vinh',  54.70, 'Powerful jockey for final stretches.',           7, 2, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now),
  (38, 'Jockey Demo',  53.50, 'Presentation jockey account ready for invitation and tournament registration.', 0, 0, DATE_SUB(@seed_now, INTERVAL 40 DAY), @seed_now);

INSERT INTO `JockeyVerification`
  (`verificationID`, `jockeyID`, `trainerName`, `trainerEmail`, `academyStableAddress`, `issuingAuthority`, `verificationLink`, `licenceType`, `expiryDate`, `weight`, `biography`, `verificationStatus`, `rejectionReason`, `resubmitCount`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1,  18, 'Trainer An',    'trainer.an@gmail.com',    'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-nam-license.pdf',    'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.50, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (2,  19, 'Trainer Binh',  'trainer.binh@gmail.com',  'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-bao-license.pdf',    'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 54.00, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (3,  20, 'Trainer Minh',  'trainer.minh@gmail.com',  'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-minh-license.pdf',   'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.00, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (4,  21, 'Trainer Ha',    'trainer.ha@gmail.com',    'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-ha-license.pdf',     'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 51.80, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (5,  22, 'Trainer Lan',   'trainer.lan@gmail.com',   'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-lan-license.pdf',    'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.20, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (6,  23, 'Trainer Phuc',  'trainer.phuc@gmail.com',  'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-phuc-license.pdf',   'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 55.00, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (7,  24, 'Trainer Thao',  'trainer.thao@gmail.com',  'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-thao-license.pdf',   'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.60, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (8,  25, 'Trainer Tuan',  'trainer.tuan@gmail.com',  'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-tuan-license.pdf',   'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 54.40, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (9,  26, 'Trainer Long',  'trainer.long@gmail.com',  'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-long-license.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.90, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (10, 27, 'Trainer Dat',   'trainer.dat@gmail.com',   'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-dat-license.pdf',  'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.30, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (11, 28, 'Trainer Quang', 'trainer.quang@gmail.com', 'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-quang-license.pdf','PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 54.10, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (12, 29, 'Trainer Duy',   'trainer.duy@gmail.com',   'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-duy-license.pdf',  'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.70, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (13, 30, 'Trainer Son',   'trainer.son@gmail.com',   'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-son-license.pdf',  'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 55.20, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (14, 31, 'Trainer Trung', 'trainer.trung@gmail.com', 'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-trung-license.pdf','PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.90, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (15, 32, 'Trainer Kiet',  'trainer.kiet@gmail.com',  'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-kiet-license.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.40, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (16, 33, 'Trainer Vinh',  'trainer.vinh@gmail.com',  'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-vinh-license.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 54.70, 'Approved professional jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now),
  (17, 38, 'Trainer Demo',  'trainer.demo@gmail.com',  'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-practice-license.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.50, 'Approved practice jockey for presentation flow.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), @seed_now);

INSERT INTO `Horse`
  (`horseID`, `ownerID`, `horseName`, `age`, `dayOfBirth`, `weight`, `colour`, `sex`, `breeding`, `trainer`, `healthCertExpiry`, `healthCertificateUrl`, `officialHorseProfileUrl`, `status`, `rejectionReason`, `createdAt`, `updatedAt`)
VALUES
  (1,  2,  'Saigon Thunder',   4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 480.00, 'Bay',      'MALE',   'Thoroughbred', 'Trainer An',    DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/saigon-thunder-health.pdf',   'https://www.racingandsports.com.au/thoroughbred/horse/saigon-thunder',   'ACTIVE', NULL, @seed_now, @seed_now),
  (2,  3,  'Mekong Blaze',     5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 496.00, 'Chestnut', 'MALE',   'Thoroughbred', 'Trainer Binh',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/mekong-blaze-health.pdf',     'https://www.racingandsports.com.au/thoroughbred/horse/mekong-blaze',     'ACTIVE', NULL, @seed_now, @seed_now),
  (3,  4,  'Minh Comet',       4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 502.00, 'Black',    'MALE',   'Thoroughbred', 'Trainer Minh',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/minh-comet-health.pdf',       'https://www.racingandsports.com.au/thoroughbred/horse/minh-comet',       'ACTIVE', NULL, @seed_now, @seed_now),
  (4,  5,  'Bangkok Arrow',    6, DATE_SUB(@seed_today, INTERVAL 6 YEAR), 510.00, 'Grey',     'FEMALE', 'Thoroughbred', 'Trainer Bao',   DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/bangkok-arrow-health.pdf',    'https://www.racingandsports.com.au/thoroughbred/horse/bangkok-arrow',    'ACTIVE', NULL, @seed_now, @seed_now),
  (5,  6,  'Golden Lotus',     5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 488.00, 'Bay',      'FEMALE', 'Thoroughbred', 'Trainer Linh',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/golden-lotus-health.pdf',     'https://www.racingandsports.com.au/thoroughbred/horse/golden-lotus',     'ACTIVE', NULL, @seed_now, @seed_now),
  (6,  7,  'Chiang Star',      4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 475.00, 'Brown',    'MALE',   'Thoroughbred', 'Trainer An',    DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/chiang-star-health.pdf',      'https://www.racingandsports.com.au/thoroughbred/horse/chiang-star',      'ACTIVE', NULL, @seed_now, @seed_now),
  (7,  8,  'River Orchid',     5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 492.00, 'Chestnut', 'FEMALE', 'Thoroughbred', 'Trainer Mai',   DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/river-orchid-health.pdf',     'https://www.racingandsports.com.au/thoroughbred/horse/river-orchid',     'ACTIVE', NULL, @seed_now, @seed_now),
  (8,  9,  'Emerald Wind',     4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 486.00, 'Bay',      'MALE',   'Thoroughbred', 'Trainer Phong', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/emerald-wind-health.pdf',     'https://www.racingandsports.com.au/thoroughbred/horse/emerald-wind',     'ACTIVE', NULL, @seed_now, @seed_now),
  (9,  10, 'Lanna Storm',      5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 500.00, 'Black',    'MALE',   'Thoroughbred', 'Trainer Trang', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/lanna-storm-health.pdf',      'https://www.racingandsports.com.au/thoroughbred/horse/lanna-storm',      'ACTIVE', NULL, @seed_now, @seed_now),
  (10, 11, 'Northern Echo',    4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 482.00, 'Bay',      'FEMALE', 'Thoroughbred', 'Trainer Viet',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/northern-echo-health.pdf',    'https://www.racingandsports.com.au/thoroughbred/horse/northern-echo',    'ACTIVE', NULL, @seed_now, @seed_now),
  (11, 12, 'Siam Falcon',      6, DATE_SUB(@seed_today, INTERVAL 6 YEAR), 515.00, 'Grey',     'MALE',   'Thoroughbred', 'Trainer Lam',   DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/siam-falcon-health.pdf',      'https://www.racingandsports.com.au/thoroughbred/horse/siam-falcon',      'ACTIVE', NULL, @seed_now, @seed_now),
  (12, 13, 'Lotus Pearl',      5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 490.00, 'Chestnut', 'FEMALE', 'Thoroughbred', 'Trainer Hoa',   DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/lotus-pearl-health.pdf',      'https://www.racingandsports.com.au/thoroughbred/horse/lotus-pearl',      'ACTIVE', NULL, @seed_now, @seed_now),
  (13, 14, 'Mountain Flash',   4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 478.00, 'Brown',    'MALE',   'Thoroughbred', 'Trainer Son',   DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/mountain-flash-health.pdf',   'https://www.racingandsports.com.au/thoroughbred/horse/mountain-flash',   'ACTIVE', NULL, @seed_now, @seed_now),
  (14, 15, 'Royal Jasmine',    5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 493.00, 'Bay',      'FEMALE', 'Thoroughbred', 'Trainer Nam',   DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/royal-jasmine-health.pdf',    'https://www.racingandsports.com.au/thoroughbred/horse/royal-jasmine',    'ACTIVE', NULL, @seed_now, @seed_now),
  (15, 16, 'Dragon Valley',    6, DATE_SUB(@seed_today, INTERVAL 6 YEAR), 505.00, 'Black',    'MALE',   'Thoroughbred', 'Trainer Ha',    DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/dragon-valley-health.pdf',    'https://www.racingandsports.com.au/thoroughbred/horse/dragon-valley',    'ACTIVE', NULL, @seed_now, @seed_now),
  (16, 17, 'Silver Orchid',    4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 487.00, 'Grey',     'FEMALE', 'Thoroughbred', 'Trainer Ngoc',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/silver-orchid-health.pdf',    'https://www.racingandsports.com.au/thoroughbred/horse/silver-orchid',    'ACTIVE', NULL, @seed_now, @seed_now),
  (17, 37, 'Victory Flame',    4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 492.00, 'Bay',      'MALE',   'Thoroughbred', 'Trainer Demo',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/victory-flame-health.pdf',     'https://www.racingandsports.com.au/thoroughbred/horse/victory-flame',     'ACTIVE', NULL, @seed_now, @seed_now),
  (18, 37, 'Victory Pearl',    5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 486.00, 'Chestnut', 'FEMALE', 'Thoroughbred', 'Trainer Demo',  DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/victory-pearl-health.pdf',     'https://www.racingandsports.com.au/thoroughbred/horse/victory-pearl',     'ACTIVE', NULL, @seed_now, @seed_now);

INSERT INTO `Tournament`
  (`tournamentID`, `tournamentName`, `venue`, `venueImageUrl`, `description`, `registrationOpenAt`, `registrationCloseAt`, `startDate`, `endDate`, `maxRegistrations`, `entryFee`, `status`, `createdBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 'Bangkok Future Championship', 'Bangkok Equestrian Park', 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80', 'Presentation tournament with one three-entry race and one five-entry race.', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_today, INTERVAL 5 DAY), DATE_ADD(@seed_today, INTERVAL 7 DAY), 24, 1000000.00, 'OPEN_FOR_REGISTRATION', 1, @seed_now, @seed_now),
  (2, 'Chiang Mai Heritage Cup', 'Chiang Mai Main Track', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 'Presentation tournament with one three-entry race and one five-entry race.', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 6 DAY), DATE_ADD(@seed_today, INTERVAL 12 DAY), DATE_ADD(@seed_today, INTERVAL 14 DAY), 24, 1000000.00, 'OPEN_FOR_REGISTRATION', 1, @seed_now, @seed_now);

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
  (1, 1, 'Bangkok Sprint',       'Bangkok Track A',    'https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 5 DAY),  '10:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 5 DAY),  '11:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 2 DAY),  '09:00:00'), NULL, NULL, 1200, 6, 1, 'OPEN_FOR_REGISTRATION', NULL, NULL, NULL, NULL, @seed_now, @seed_now),
  (2, 1, 'Bangkok Classic',      'Bangkok Track B',    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 6 DAY),  '14:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 6 DAY),  '15:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 3 DAY),  '09:00:00'), NULL, NULL, 1600, 6, 2, 'OPEN_FOR_REGISTRATION', NULL, NULL, NULL, NULL, @seed_now, @seed_now),
  (3, 2, 'Chiang Mai Sprint',    'Chiang Mai Main',    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 12 DAY), '09:30:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 12 DAY), '10:30:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 9 DAY),  '09:00:00'), NULL, NULL, 1200, 6, 1, 'OPEN_FOR_REGISTRATION', NULL, NULL, NULL, NULL, @seed_now, @seed_now),
  (4, 2, 'Chiang Mai Endurance', 'Chiang Mai Valley',  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 13 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 13 DAY), '16:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 10 DAY), '09:00:00'), NULL, NULL, 2000, 6, 2, 'OPEN_FOR_REGISTRATION', NULL, NULL, NULL, NULL, @seed_now, @seed_now);

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
  (1,  1, 1,  2,  18, 'REG-FULL-001', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (2,  1, 2,  3,  19, 'REG-FULL-002', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (3,  1, 3,  4,  20, 'REG-FULL-003', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (4,  1, 4,  5,  21, 'REG-FULL-004', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (5,  1, 5,  6,  22, 'REG-FULL-005', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (6,  1, 6,  7,  23, 'REG-FULL-006', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (7,  1, 7,  8,  24, 'REG-FULL-007', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (8,  1, 8,  9,  25, 'REG-FULL-008', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (9,  2, 9,  10, 26, 'REG-FULL-009', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (10, 2, 10, 11, 27, 'REG-FULL-010', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (11, 2, 11, 12, 28, 'REG-FULL-011', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (12, 2, 12, 13, 29, 'REG-FULL-012', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (13, 2, 13, 14, 30, 'REG-FULL-013', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (14, 2, 14, 15, 31, 'REG-FULL-014', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (15, 2, 15, 16, 32, 'REG-FULL-015', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (16, 2, 16, 17, 33, 'REG-FULL-016', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now);

INSERT INTO `JockeyInvitation`
  (`invitationID`, `registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `status`, `message`, `createdAt`, `expiredAt`, `respondedAt`)
VALUES
  (1,  1,  1, 1,  2,  18, 'ACCEPTED', 'Accepted invitation for Bangkok Future Championship.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (2,  2,  1, 2,  3,  19, 'ACCEPTED', 'Accepted invitation for Bangkok Future Championship.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (3,  3,  1, 3,  4,  20, 'ACCEPTED', 'Accepted invitation for Bangkok Future Championship.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (4,  4,  1, 4,  5,  21, 'ACCEPTED', 'Accepted invitation for Bangkok Future Championship.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (5,  5,  1, 5,  6,  22, 'ACCEPTED', 'Accepted invitation for Bangkok Future Championship.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (6,  6,  1, 6,  7,  23, 'ACCEPTED', 'Accepted invitation for Bangkok Future Championship.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (7,  7,  1, 7,  8,  24, 'ACCEPTED', 'Accepted invitation for Bangkok Future Championship.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (8,  8,  1, 8,  9,  25, 'ACCEPTED', 'Accepted invitation for Bangkok Future Championship.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 4 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (9,  9,  2, 9,  10, 26, 'ACCEPTED', 'Accepted invitation for Chiang Mai Heritage Cup.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 11 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (10, 10, 2, 10, 11, 27, 'ACCEPTED', 'Accepted invitation for Chiang Mai Heritage Cup.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 11 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (11, 11, 2, 11, 12, 28, 'ACCEPTED', 'Accepted invitation for Chiang Mai Heritage Cup.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 11 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (12, 12, 2, 12, 13, 29, 'ACCEPTED', 'Accepted invitation for Chiang Mai Heritage Cup.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 11 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (13, 13, 2, 13, 14, 30, 'ACCEPTED', 'Accepted invitation for Chiang Mai Heritage Cup.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 11 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (14, 14, 2, 14, 15, 31, 'ACCEPTED', 'Accepted invitation for Chiang Mai Heritage Cup.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 11 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (15, 15, 2, 15, 16, 32, 'ACCEPTED', 'Accepted invitation for Chiang Mai Heritage Cup.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 11 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (16, 16, 2, 16, 17, 33, 'ACCEPTED', 'Accepted invitation for Chiang Mai Heritage Cup.', DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 11 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY));

INSERT INTO `PaymentTransaction`
  (`paymentTransactionID`, `userID`, `registrationID`, `walletID`, `purpose`, `provider`, `amount`, `currency`, `txnRef`, `providerTransactionNo`, `status`, `payUrl`, `responseCode`, `rawResponse`, `createdAt`, `paidAt`, `updatedAt`)
VALUES
  (1,  2,  1,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-001', 'VNP-FULL-001', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=1',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (2,  3,  2,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-002', 'VNP-FULL-002', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=2',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (3,  4,  3,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-003', 'VNP-FULL-003', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=3',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (4,  5,  4,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-004', 'VNP-FULL-004', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=4',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (5,  6,  5,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-005', 'VNP-FULL-005', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=5',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (6,  7,  6,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-006', 'VNP-FULL-006', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=6',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (7,  8,  7,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-007', 'VNP-FULL-007', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=7',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (8,  9,  8,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-008', 'VNP-FULL-008', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=8',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (9,  10, 9,  NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-009', 'VNP-FULL-009', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=9',  '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (10, 11, 10, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-010', 'VNP-FULL-010', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=10', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (11, 12, 11, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-011', 'VNP-FULL-011', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=11', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (12, 13, 12, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-012', 'VNP-FULL-012', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=12', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (13, 14, 13, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-013', 'VNP-FULL-013', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=13', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (14, 15, 14, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-014', 'VNP-FULL-014', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=14', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (15, 16, 15, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-015', 'VNP-FULL-015', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=15', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (16, 17, 16, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'FULL-REG-016', 'VNP-FULL-016', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=16', '00', '{"source":"full_project_seed"}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now);

INSERT INTO `SystemFund`
  (`systemFundID`, `balance`, `bettingFeeRevenue`, `minusPoolSubsidyPaid`, `createdAt`, `updatedAt`)
VALUES
  (1, 100000000.00, 0.00, 0.00, @seed_now, @seed_now);

INSERT INTO `BetProduct`
  (`betProductID`, `code`, `name`, `description`, `minStake`, `maxDailyStake`, `operatorFeeRate`, `active`, `createdAt`, `updatedAt`)
VALUES
  (1, 'WIN', 'Top 1', 'Pick the horse that finishes in first place.', 10000.00, 1000000.00, 0.1000, true, @seed_now, @seed_now),
  (2, 'PLACE', 'Top 3', 'Pick a horse that finishes in the first three places.', 10000.00, 1000000.00, 0.1000, true, @seed_now, @seed_now);

INSERT INTO `Wallet`
  (`walletID`, `userID`, `balance`, `lockedBalance`, `currency`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1, 39, 0.00, 0.00, 'VND', 'ACTIVE', DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (2, 40, 0.00, 0.00, 'VND', 'ACTIVE', DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (3, 41, 0.00, 0.00, 'VND', 'ACTIVE', DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now);

INSERT INTO `RaceEntry`
  (`raceEntryID`, `raceID`, `registrationID`, `startingStall`, `status`, `assignedAt`, `assignedBy`, `cancelledAt`, `cancelledBy`, `cancellationReason`)
VALUES
  (1,  1,  1, 1, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (2,  1,  2, 2, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (3,  1,  3, 3, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (4,  2,  4, 1, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (5,  2,  5, 2, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (6,  2,  6, 3, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (7,  2,  7, 4, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (8,  2,  8, 5, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (9,  3,  9, 1, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (10, 3, 10, 2, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (11, 3, 11, 3, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (12, 4, 12, 1, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (13, 4, 13, 2, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (14, 4, 14, 3, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (15, 4, 15, 4, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (16, 4, 16, 5, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL);

-- Intentionally omitted:
-- - RefereeAssignment
-- - BetEvent
-- - BetTicket
-- - BetSettlement
-- - RaceResultSubmission
-- - RaceResult
-- - PrizeDistribution
-- - WalletTransaction

COMMIT;

SELECT 'Roles' AS `tableName`, COUNT(*) AS `rowCount` FROM `Roles`
UNION ALL SELECT 'Users', COUNT(*) FROM `Users`
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
UNION ALL SELECT 'user_verifications', COUNT(*) FROM `user_verifications`
UNION ALL SELECT 'SystemFund', COUNT(*) FROM `SystemFund`
UNION ALL SELECT 'FundTransaction', COUNT(*) FROM `FundTransaction`
UNION ALL SELECT 'RaceEntry', COUNT(*) FROM `RaceEntry`
UNION ALL SELECT 'RefereeAssignment', COUNT(*) FROM `RefereeAssignment`
UNION ALL SELECT 'BetProduct', COUNT(*) FROM `BetProduct`
UNION ALL SELECT 'BetEvent', COUNT(*) FROM `BetEvent`
UNION ALL SELECT 'BetTicket', COUNT(*) FROM `BetTicket`
UNION ALL SELECT 'RaceResultSubmission', COUNT(*) FROM `RaceResultSubmission`
UNION ALL SELECT 'RaceResult', COUNT(*) FROM `RaceResult`
UNION ALL SELECT 'PrizeDistribution', COUNT(*) FROM `PrizeDistribution`
UNION ALL SELECT 'Wallet', COUNT(*) FROM `Wallet`
UNION ALL SELECT 'WalletTransaction', COUNT(*) FROM `WalletTransaction`;
