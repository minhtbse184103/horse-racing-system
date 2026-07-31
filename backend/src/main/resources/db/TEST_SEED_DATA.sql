USE `horse_racing_system`;

-- Run once immediately after team_schema.sql on a fresh database.
-- Login password for every seeded account: admin123
-- Admin login: admin@horse.test / admin123
-- Dedicated end-to-end betting accounts (password: admin123):
--   spectator1@horse.test: initial wallet 9,000,000 VND; one active 300,000 VND bet.
--   spectator2@horse.test: initial wallet 9,000,000 VND; no betting history.
--   bet.owner1..3 / bet.jockey1..3: three approved pairs entered in Race 8.
-- Race 8 is ENTRIES_FINALIZED with three runners and an assigned referee, but
-- intentionally has no BetEvent. Admin can configure/open betting, accept bets,
-- use demo fast-forward, mark the race READY, and launch it without missing
-- race-entry/referee prerequisites.
-- KYC and Wallet are SPECTATOR-only. OWNER/JOCKEY test accounts intentionally
-- have neither row; registration fees do not use Wallet.

SET @seed_now = NOW();
SET @seed_today = CURDATE();
SET @seed_password = '$2a$10$Dn/5oVH2fgNQAgHNtQL6W.HOCNPCocwtBa01l5LHAzHyPHu1iDxs6';

START TRANSACTION;

-- Roles 1-5 are created by team_schema.sql.
INSERT INTO `Users`
  (`userID`, `roleID`, `accountType`, `username`, `email`, `password`, `phone`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1,  1, 'ADMIN',     'admin.demo',    'admin@horse.test',          @seed_password, '0900000001', 'ACTIVE', @seed_now, @seed_now),
  (2,  2, 'OWNER',     'owner.alice',   'owner.alice@horse.test',    @seed_password, '0900000002', 'ACTIVE', @seed_now, @seed_now),
  (3,  2, 'OWNER',     'owner.bao',     'owner.bao@horse.test',      @seed_password, '0900000003', 'ACTIVE', @seed_now, @seed_now),
  (4,  2, 'OWNER',     'owner.chloe',   'owner.chloe@horse.test',    @seed_password, '0900000004', 'ACTIVE', @seed_now, @seed_now),
  (5,  3, 'JOCKEY',    'jockey.daniel', 'jockey.daniel@horse.test',  @seed_password, '0900000005', 'ACTIVE', @seed_now, @seed_now),
  (6,  3, 'JOCKEY',    'jockey.emma',   'jockey.emma@horse.test',    @seed_password, '0900000006', 'ACTIVE', @seed_now, @seed_now),
  (7,  3, 'JOCKEY',    'jockey.finn',   'jockey.finn@horse.test',    @seed_password, '0900000007', 'ACTIVE', @seed_now, @seed_now),
  (8,  4, 'REFEREE',   'referee.grace', 'referee.grace@horse.test',  @seed_password, '0900000008', 'ACTIVE', @seed_now, @seed_now),
  (9,  4, 'REFEREE',   'referee.henry', 'referee.henry@horse.test',  @seed_password, '0900000009', 'ACTIVE', @seed_now, @seed_now),
  (10, 5, 'OWNER',     'owner.pending', 'owner.pending@horse.test',  @seed_password, '0900000010', 'ACTIVE', @seed_now, @seed_now),
  (11, 5, 'OWNER',     'owner.rejected','owner.rejected@horse.test', @seed_password, '0900000011', 'ACTIVE', @seed_now, @seed_now),
  (12, 5, 'JOCKEY',    'jockey.pending','jockey.pending@horse.test', @seed_password, '0900000012', 'ACTIVE', @seed_now, @seed_now),
  (13, 5, 'SPECTATOR', 'spectator.kyc', 'spectator.kyc@horse.test',  @seed_password, '0900000013', 'ACTIVE', @seed_now, @seed_now),
  (14, 5, 'SPECTATOR', 'spectator.bet', 'spectator.bet@horse.test',  @seed_password, '0900000014', 'ACTIVE', @seed_now, @seed_now),
  (15, 5, 'SPECTATOR', 'spectator1',    'spectator1@horse.test',     @seed_password, '0900000015', 'ACTIVE', @seed_now, @seed_now),
  (16, 5, 'SPECTATOR', 'spectator2',    'spectator2@horse.test',     @seed_password, '0900000016', 'ACTIVE', @seed_now, @seed_now),
  (17, 2, 'OWNER',     'bet.owner1',    'bet.owner1@horse.test',     @seed_password, '0900000017', 'ACTIVE', @seed_now, @seed_now),
  (18, 2, 'OWNER',     'bet.owner2',    'bet.owner2@horse.test',     @seed_password, '0900000018', 'ACTIVE', @seed_now, @seed_now),
  (19, 2, 'OWNER',     'bet.owner3',    'bet.owner3@horse.test',     @seed_password, '0900000019', 'ACTIVE', @seed_now, @seed_now),
  (20, 3, 'JOCKEY',    'bet.jockey1',   'bet.jockey1@horse.test',    @seed_password, '0900000020', 'ACTIVE', @seed_now, @seed_now),
  (21, 3, 'JOCKEY',    'bet.jockey2',   'bet.jockey2@horse.test',    @seed_password, '0900000021', 'ACTIVE', @seed_now, @seed_now),
  (22, 3, 'JOCKEY',    'bet.jockey3',   'bet.jockey3@horse.test',    @seed_password, '0900000022', 'ACTIVE', @seed_now, @seed_now),
  (23, 2, 'OWNER',     'owner.dara',    'owner.dara@horse.test',     @seed_password, '0900000023', 'ACTIVE', @seed_now, @seed_now),
  (24, 2, 'OWNER',     'owner.elena',   'owner.elena@horse.test',    @seed_password, '0900000024', 'ACTIVE', @seed_now, @seed_now),
  (25, 3, 'JOCKEY',    'jockey.gavin',  'jockey.gavin@horse.test',   @seed_password, '0900000025', 'ACTIVE', @seed_now, @seed_now),
  (26, 3, 'JOCKEY',    'jockey.hana',   'jockey.hana@horse.test',    @seed_password, '0900000026', 'ACTIVE', @seed_now, @seed_now);

INSERT INTO `user_verifications`
  (`verification_id`, `user_id`, `provider`, `provider_session_id`, `provider_session_number`, `workflow_id`, `vendor_data`, `verification_url`, `status`, `id_verification_status`, `liveness_status`, `face_match_status`, `verified_full_name`, `verified_date_of_birth`, `document_type`, `document_last_four`, `attempt_number`, `submitted_at`, `verified_at`, `expires_at`, `created_at`, `updated_at`)
VALUES
  (7, 14, 'DIDIT', 'seed-didit-14', 14, 'seed-workflow', 'user-14', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Spectator Bettor',  DATE_SUB(@seed_today, INTERVAL 30 YEAR), 'ID_CARD', '0014', 1, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (8, 15, 'DIDIT', 'seed-didit-15', 15, 'seed-workflow', 'user-15', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Bet Flow Spectator One', DATE_SUB(@seed_today, INTERVAL 28 YEAR), 'ID_CARD', '0015', 1, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (9, 16, 'DIDIT', 'seed-didit-16', 16, 'seed-workflow', 'user-16', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Bet Flow Spectator Two', DATE_SUB(@seed_today, INTERVAL 27 YEAR), 'ID_CARD', '0016', 1, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY));

INSERT INTO `OwnerApplication`
  (`applicationID`, `userID`, `stableName`, `stableAddress`, `stableCertificateUrl`, `totalHorsesOwned`, `horseOwnershipProofUrl`, `status`, `rejectReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 2,  'Alice Victory Stable', 'Bangkok Stable District, Bangkok', 'https://example.com/owners/alice/stable-certificate.pdf', 2, 'https://example.com/owners/alice/horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 120 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY), 1, DATE_SUB(@seed_now, INTERVAL 120 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  (2, 3,  'Bao Northern Stable', 'Chiang Mai Racing Road, Chiang Mai', 'https://example.com/owners/bao/stable-certificate.pdf', 3, 'https://example.com/owners/bao/horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 110 DAY), DATE_SUB(@seed_now, INTERVAL 108 DAY), 1, DATE_SUB(@seed_now, INTERVAL 110 DAY), DATE_SUB(@seed_now, INTERVAL 108 DAY)),
  (3, 4,  'Chloe Coastal Stable', 'Phuket Equestrian Park, Phuket', 'https://example.com/owners/chloe/stable-certificate.pdf', 3, 'https://example.com/owners/chloe/horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 100 DAY), DATE_SUB(@seed_now, INTERVAL 98 DAY),  1, DATE_SUB(@seed_now, INTERVAL 100 DAY), DATE_SUB(@seed_now, INTERVAL 98 DAY)),
  (4, 10, 'Pending City Stable', 'District 7, Ho Chi Minh City', 'https://example.com/owners/pending/stable-certificate.pdf', 1, 'https://example.com/owners/pending/horse-ownership.pdf', 'PENDING', NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (5, 11, 'Rejected Riverside Stable', 'Hai Chau District, Da Nang', 'https://example.com/owners/rejected/stable-certificate.pdf', 1, 'https://example.com/owners/rejected/horse-ownership.pdf', 'REJECTED', 'Stable ownership document is not readable.', DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY), 1, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY)),
  (6, 17, 'Bet Flow Stable One', 'Thu Duc City, Ho Chi Minh City', 'https://example.com/bet-flow/owner-1/stable.pdf', 1, 'https://example.com/bet-flow/owner-1/ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY), 1, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (7, 18, 'Bet Flow Stable Two', 'District 7, Ho Chi Minh City', 'https://example.com/bet-flow/owner-2/stable.pdf', 1, 'https://example.com/bet-flow/owner-2/ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY), 1, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (8, 19, 'Bet Flow Stable Three', 'Bien Hoa City, Dong Nai', 'https://example.com/bet-flow/owner-3/stable.pdf', 1, 'https://example.com/bet-flow/owner-3/ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY), 1, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (9, 23, 'Dara Highland Stable', 'Nakhon Ratchasima Racing Farm', 'https://example.com/owners/dara/stable-certificate.pdf', 1, 'https://example.com/owners/dara/horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY), 1, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (10, 24, 'Elena River Stable', 'Ayutthaya Riverside Stables', 'https://example.com/owners/elena/stable-certificate.pdf', 1, 'https://example.com/owners/elena/horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 55 DAY), DATE_SUB(@seed_now, INTERVAL 53 DAY), 1, DATE_SUB(@seed_now, INTERVAL 55 DAY), DATE_SUB(@seed_now, INTERVAL 53 DAY));

INSERT INTO `OwnerProfile`
  (`ownerID`, `applicationID`, `createdAt`, `updatedAt`)
VALUES
  (2, 1, DATE_SUB(@seed_now, INTERVAL 118 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  (3, 2, DATE_SUB(@seed_now, INTERVAL 108 DAY), DATE_SUB(@seed_now, INTERVAL 108 DAY)),
  (4, 3, DATE_SUB(@seed_now, INTERVAL 98 DAY),  DATE_SUB(@seed_now, INTERVAL 98 DAY)),
  (17, 6, DATE_SUB(@seed_now, INTERVAL 58 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (18, 7, DATE_SUB(@seed_now, INTERVAL 58 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (19, 8, DATE_SUB(@seed_now, INTERVAL 58 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (23, 9, DATE_SUB(@seed_now, INTERVAL 58 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (24, 10, DATE_SUB(@seed_now, INTERVAL 53 DAY), DATE_SUB(@seed_now, INTERVAL 53 DAY));

INSERT INTO `JockeyProfile`
  (`jockeyID`, `fullName`, `weight`, `biography`, `totalRaces`, `totalWins`, `createdAt`, `updatedAt`)
VALUES
  (5, 'Demo Jockey Five', 52.50, 'Experienced sprint jockey.', 1, 1, DATE_SUB(@seed_now, INTERVAL 300 DAY), @seed_now),
  (6, 'Demo Jockey Six', 54.00, 'Specialist in middle-distance races.', 2, 1, DATE_SUB(@seed_now, INTERVAL 280 DAY), @seed_now),
  (7, 'Demo Jockey Seven', 55.25, 'New jockey awaiting verification.', 1, 0, DATE_SUB(@seed_now, INTERVAL 30 DAY), @seed_now),
  (20, 'Bet Flow Jockey One', 52.00, 'Approved jockey for the dedicated betting flow.', 0, 0, DATE_SUB(@seed_now, INTERVAL 60 DAY), @seed_now),
  (21, 'Bet Flow Jockey Two', 53.00, 'Approved jockey for the dedicated betting flow.', 0, 0, DATE_SUB(@seed_now, INTERVAL 60 DAY), @seed_now),
  (22, 'Bet Flow Jockey Three', 54.00, 'Approved jockey for the dedicated betting flow.', 0, 0, DATE_SUB(@seed_now, INTERVAL 60 DAY), @seed_now),
  (25, 'Demo Jockey Gavin', 53.40, 'Reliable tactical jockey for demo race entries.', 0, 0, DATE_SUB(@seed_now, INTERVAL 50 DAY), @seed_now),
  (26, 'Demo Jockey Hana', 52.90, 'Fast-start specialist for sprint demonstrations.', 0, 0, DATE_SUB(@seed_now, INTERVAL 45 DAY), @seed_now);

INSERT INTO `JockeyVerification`
  (`verificationID`, `jockeyID`, `trainerName`, `trainerEmail`, `academyStableAddress`, `issuingAuthority`, `verificationLink`, `licenceType`, `expiryDate`, `weight`, `biography`, `verificationStatus`, `rejectionReason`, `resubmitCount`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 5, 'Trainer Somchai', 'somchai@trainer.test', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://example.com/verify/jockey-5', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.50, 'Experienced sprint jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 200 DAY), DATE_SUB(@seed_now, INTERVAL 198 DAY), 1, DATE_SUB(@seed_now, INTERVAL 200 DAY), DATE_SUB(@seed_now, INTERVAL 198 DAY)),
  (2, 6, 'Trainer Mali', 'mali@trainer.test', 'Chiang Mai Racing Academy', 'Thailand Racing Authority', 'https://example.com/verify/jockey-6', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 54.00, 'Specialist in middle-distance races.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 188 DAY), 1, DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 188 DAY)),
  (3, 7, 'Trainer Arun', 'arun@trainer.test', 'Phuket Riding School', 'Thailand Racing Authority', 'https://example.com/verify/jockey-7', 'AMATEUR', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 55.25, 'Newly approved jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 28 DAY), 1, DATE_SUB(@seed_now, INTERVAL 30 DAY), DATE_SUB(@seed_now, INTERVAL 28 DAY)),
  (4, 12, 'Trainer Linh', 'linh@trainer.test', 'Saigon Racing Academy', 'Vietnam Racing Authority', 'https://example.com/verify/jockey-12', 'TRAINEE', DATE_ADD(@seed_today, INTERVAL 18 MONTH), 51.75, 'Pending jockey application waiting for admin approval.', 'PENDING', NULL, 0, DATE_SUB(@seed_now, INTERVAL 1 DAY), NULL, NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (5, 20, 'Trainer Bet One', 'trainer.bet1@horse.test', 'Saigon Racing Academy', 'Vietnam Racing Authority', 'https://example.com/verify/bet-jockey-1', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.00, 'Approved jockey for the betting flow.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY), 1, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (6, 21, 'Trainer Bet Two', 'trainer.bet2@horse.test', 'Saigon Racing Academy', 'Vietnam Racing Authority', 'https://example.com/verify/bet-jockey-2', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.00, 'Approved jockey for the betting flow.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY), 1, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (7, 22, 'Trainer Bet Three', 'trainer.bet3@horse.test', 'Saigon Racing Academy', 'Vietnam Racing Authority', 'https://example.com/verify/bet-jockey-3', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 54.00, 'Approved jockey for the betting flow.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY), 1, DATE_SUB(@seed_now, INTERVAL 60 DAY), DATE_SUB(@seed_now, INTERVAL 58 DAY)),
  (8, 25, 'Trainer Kiet', 'kiet@trainer.test', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://example.com/verify/jockey-25', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.40, 'Approved jockey for unique demo assignment.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 50 DAY), DATE_SUB(@seed_now, INTERVAL 48 DAY), 1, DATE_SUB(@seed_now, INTERVAL 50 DAY), DATE_SUB(@seed_now, INTERVAL 48 DAY)),
  (9, 26, 'Trainer Suda', 'suda@trainer.test', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://example.com/verify/jockey-26', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.90, 'Approved jockey for unique demo assignment.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 45 DAY), DATE_SUB(@seed_now, INTERVAL 43 DAY), 1, DATE_SUB(@seed_now, INTERVAL 45 DAY), DATE_SUB(@seed_now, INTERVAL 43 DAY));

INSERT INTO `JockeyVerificationFile`
  (`fileID`, `verificationID`, `fileUrl`, `fileType`, `uploadedAt`)
VALUES
  (1, 1, 'https://picsum.photos/seed/jockey-5-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 200 DAY)),
  (2, 2, 'https://picsum.photos/seed/jockey-6-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 190 DAY)),
  (3, 3, 'https://picsum.photos/seed/jockey-7-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 30 DAY)),
  (4, 4, 'https://picsum.photos/seed/jockey-12-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (5, 5, 'https://picsum.photos/seed/bet-jockey-1-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 60 DAY)),
  (6, 6, 'https://picsum.photos/seed/bet-jockey-2-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 60 DAY)),
  (7, 7, 'https://picsum.photos/seed/bet-jockey-3-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 60 DAY)),
  (8, 8, 'https://picsum.photos/seed/jockey-25-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 50 DAY)),
  (9, 9, 'https://picsum.photos/seed/jockey-26-license/900/560', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 45 DAY));

INSERT INTO `Wallet`
  (`walletID`, `userID`, `balance`, `lockedBalance`, `currency`, `status`, `createdAt`, `updatedAt`)
VALUES
  (7, 14, 5000000.00, 800000.00, 'VND', 'ACTIVE', DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  -- balance is the original deposited balance; active bets move money to lockedBalance.
  (8, 15, 9000000.00, 300000.00, 'VND', 'ACTIVE', DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now),
  (9, 16, 9000000.00,      0.00, 'VND', 'ACTIVE', DATE_SUB(@seed_now, INTERVAL 2 DAY), @seed_now);

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
  (8, 3, 'Demo Eclipse', 6, DATE_SUB(@seed_today, INTERVAL 6 YEAR), 490.00, 'Black',    'FEMALE', 'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/8/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-eclipse', 'REJECTED', 'Health certificate image is unclear.', @seed_now, @seed_now),
  (9, 17, 'Bet Flow Lightning', 4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 482.00, 'Bay', 'MALE', 'Thoroughbred', 'Bet Flow Trainer One', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/bet-flow/horses/9-health.pdf', 'https://example.com/bet-flow/horses/9-profile', 'ACTIVE', NULL, DATE_SUB(@seed_now, INTERVAL 55 DAY), @seed_now),
  (10, 18, 'Bet Flow Hurricane', 5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 495.00, 'Black', 'MALE', 'Thoroughbred', 'Bet Flow Trainer Two', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/bet-flow/horses/10-health.pdf', 'https://example.com/bet-flow/horses/10-profile', 'ACTIVE', NULL, DATE_SUB(@seed_now, INTERVAL 55 DAY), @seed_now),
  (11, 19, 'Bet Flow Starlight', 4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 478.00, 'Grey', 'MALE', 'Thoroughbred', 'Bet Flow Trainer Three', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/bet-flow/horses/11-health.pdf', 'https://example.com/bet-flow/horses/11-profile', 'ACTIVE', NULL, DATE_SUB(@seed_now, INTERVAL 55 DAY), @seed_now),
  (12, 23, 'Demo Tempest', 5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 505.00, 'Bay',     'MALE',   'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/12/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-tempest', 'ACTIVE', NULL, @seed_now, @seed_now),
  (13, 24, 'Demo Sapphire', 4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 492.00, 'Grey',  'FEMALE', 'Thoroughbred', 'Demo Trainer', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://example.com/horses/13/health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/demo-sapphire', 'ACTIVE', NULL, @seed_now, @seed_now);

INSERT INTO `Tournament`
  (`tournamentID`, `tournamentName`, `venue`, `venueImageUrl`, `description`, `registrationOpenAt`, `registrationCloseAt`, `startDate`, `endDate`, `maxRegistrations`, `entryFee`, `status`, `createdBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 'Demo Future Championship', 'Bangkok Equestrian Park', NULL, 'Open Tournament for Admin Event demonstrations.', DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_ADD(@seed_now, INTERVAL 30 DAY), DATE_ADD(@seed_today, INTERVAL 40 DAY), DATE_ADD(@seed_today, INTERVAL 42 DAY), 24, 1000000.00, 'OPEN_FOR_REGISTRATION', 1, @seed_now, @seed_now),
  (2, 'Demo Heritage Cup', 'Chiang Mai Racecourse', NULL, 'Completed Tournament retained for history and result views.', DATE_SUB(@seed_now, INTERVAL 180 DAY), DATE_SUB(@seed_now, INTERVAL 150 DAY), DATE_SUB(@seed_today, INTERVAL 120 DAY), DATE_SUB(@seed_today, INTERVAL 118 DAY), 20, 2000000.00, 'COMPLETED', 1, DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  (3, 'Bet Flow Ready Cup', 'Saigon Bet Flow Racecourse', NULL, 'Dedicated end-to-end seed: race entries are finalized and Admin has not created a BetEvent yet.', DATE_SUB(@seed_now, INTERVAL 10 DAY), DATE_SUB(@seed_now, INTERVAL 3 DAY), @seed_today, DATE_ADD(@seed_today, INTERVAL 1 DAY), 12, 1000000.00, 'REGISTRATION_CLOSED', 1, DATE_SUB(@seed_now, INTERVAL 12 DAY), @seed_now);

INSERT INTO `TournamentCondition`
  (`conditionID`, `tournamentID`, `conditionType`, `operator`, `minValue`, `maxValue`, `value`)
VALUES
  (1, 1, 'AGE',    'BETWEEN', 3.00, 10.00, NULL),
  (2, 1, 'WEIGHT', 'LTE',     NULL, NULL, '550'),
  (3, 1, 'GENDER', 'EQ',      NULL, NULL, 'MALE'),
  (4, 2, 'AGE',    'BETWEEN', 3.00, 12.00, NULL),
  (5, 3, 'AGE',    'BETWEEN', 3.00, 10.00, NULL),
  (6, 3, 'WEIGHT', 'LTE',     NULL, NULL, '550'),
  (7, 3, 'GENDER', 'EQ',      NULL, NULL, 'MALE');

INSERT INTO `Race`
  (`raceID`, `tournamentID`, `raceName`, `trackName`, `trackImageUrl`, `raceStartTime`, `raceEndTime`, `entryFinalizationScheduledAt`, `entryFinalizedAt`, `entryFinalizedBy`, `distance`, `maxRunners`, `raceOrder`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 'Future Sprint',    'Bangkok Track A', 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 40 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 40 DAY), '10:30:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 38 DAY), '10:00:00'), NULL, NULL, 1200, 6, 1, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (2, 1, 'Future Classic',   'Bangkok Track A', 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 41 DAY), '13:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 41 DAY), '13:45:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 39 DAY), '13:00:00'), NULL, NULL, 1800, 6, 2, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (3, 1, 'Future Endurance', 'Bangkok Track B', 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 42 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 42 DAY), '16:00:00'), TIMESTAMP(DATE_ADD(@seed_today, INTERVAL 40 DAY), '15:00:00'), NULL, NULL, 2400, 6, 3, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  (4, 2, 'Heritage Sprint',  'Chiang Mai Main', 'https://images.unsplash.com/photo-1534777410147-084a460870fc?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 120 DAY), '10:00:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 120 DAY), '10:30:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 122 DAY), '10:00:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 122 DAY), '10:15:00'), 1, 1200, 6, 1, 'COMPLETED', DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 120 DAY)),
  (5, 2, 'Heritage Classic', 'Chiang Mai Main', 'https://images.unsplash.com/photo-1526163180810-9a17e4f915a5?auto=format&fit=crop&w=1200&q=80', TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 119 DAY), '14:00:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 119 DAY), '14:45:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 121 DAY), '14:00:00'), TIMESTAMP(DATE_SUB(@seed_today, INTERVAL 121 DAY), '14:15:00'), 1, 1800, 6, 2, 'COMPLETED', DATE_SUB(@seed_now, INTERVAL 190 DAY), DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  -- Manual-mode launch test race: raceStartTime is already in the past.
  -- Admin can finalize RaceEntry, mark it READY, then "Run Race" moves it
  -- to IN_PROGRESS after Unity launch succeeds. Has 5 ASSIGNED RaceEntry
  -- rows below and one approved Registration waiting for Admin assignment,
  -- while still satisfying MIN_RUNNERS_TO_LAUNCH. It has no RaceResult yet,
  -- so it is launchable and ready to receive a result from Unity after seeding.
  (6, 1, 'Live Test Race',   'Bangkok Track A', 'https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&w=1200&q=80', DATE_SUB(@seed_now, INTERVAL 1 HOUR), DATE_ADD(@seed_now, INTERVAL 1 HOUR), DATE_SUB(@seed_now, INTERVAL 3 DAY), NULL, NULL, 1000, 6, 4, 'OPEN_FOR_REGISTRATION', @seed_now, @seed_now),
  -- Betting demo entries are already finalized. Its OPEN events below stay
  -- inside the final 12-hour window and close exactly 5 minutes before race start.
  (7, 1, 'Betting Demo Sprint', 'Bangkok Track C', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', DATE_ADD(@seed_now, INTERVAL 6 HOUR), DATE_ADD(@seed_now, INTERVAL 390 MINUTE), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 1 HOUR), 1, 1200, 6, 5, 'ENTRIES_FINALIZED', @seed_now, @seed_now),
  -- Admin starting point for the requested bet flow. There is deliberately no
  -- BetEvent row for Race 8. Its start is within the 12-hour betting window and
  -- more than 5 minutes away, so WIN/PLACE events can be created immediately.
  -- After betting, use the demo fast-forward action before Mark READY; this
  -- closes active bet events and moves the scheduled start into the past.
  (8, 3, 'Bet Flow Ready Sprint', 'Saigon Bet Flow Track', 'https://images.unsplash.com/photo-1534777410147-084a460870fc?auto=format&fit=crop&w=1200&q=80', DATE_ADD(@seed_now, INTERVAL 8 HOUR), DATE_ADD(@seed_now, INTERVAL 510 MINUTE), DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_SUB(@seed_now, INTERVAL 1 HOUR), 1, 1200, 6, 1, 'ENTRIES_FINALIZED', @seed_now, @seed_now);

INSERT INTO `RacePrize`
  (`racePrizeID`, `raceID`, `rankPosition`, `amount`, `ownerPercent`, `jockeyPercent`)
VALUES
  (1,  1, 1, 50000000.00, 80.00, 20.00), (2,  1, 2, 30000000.00, 80.00, 20.00), (3,  1, 3, 20000000.00, 80.00, 20.00),
  (4,  2, 1, 75000000.00, 80.00, 20.00), (5,  2, 2, 45000000.00, 80.00, 20.00), (6,  2, 3, 30000000.00, 80.00, 20.00),
  (7,  3, 1, 90000000.00, 80.00, 20.00), (8,  3, 2, 54000000.00, 80.00, 20.00), (9,  3, 3, 36000000.00, 80.00, 20.00),
  (10, 4, 1, 40000000.00, 80.00, 20.00), (11, 4, 2, 24000000.00, 80.00, 20.00), (12, 4, 3, 16000000.00, 80.00, 20.00),
  (13, 5, 1, 60000000.00, 80.00, 20.00), (14, 5, 2, 36000000.00, 80.00, 20.00), (15, 5, 3, 24000000.00, 80.00, 20.00),
  (16, 6, 1, 20000000.00, 80.00, 20.00), (17, 6, 2, 12000000.00, 80.00, 20.00), (18, 6, 3, 8000000.00,  80.00, 20.00),
  (19, 7, 1, 20000000.00, 80.00, 20.00), (20, 7, 2, 12000000.00, 80.00, 20.00), (21, 7, 3, 8000000.00,  80.00, 20.00),
  (22, 8, 1, 30000000.00, 80.00, 20.00), (23, 8, 2, 18000000.00, 80.00, 20.00), (24, 8, 3, 12000000.00, 80.00, 20.00);

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
  -- Dedicated registrations for Race 6 (Live Test Race). Five are already
  -- assigned below, and REG-DEMO-013 is intentionally left unassigned so Admin
  -- can demo the final RaceEntry assignment before launch.
  (8, 1, 1, 2, 5,    'REG-DEMO-008', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (9, 1, 12, 23, 25, 'REG-DEMO-009', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (10, 1, 13, 24, 26, 'REG-DEMO-010', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (11, 1, 4, 3, 6,   'REG-DEMO-011', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (12, 1, 5, 4, 7,   'REG-DEMO-012', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (13, 1, 6, 4, 6,   'REG-DEMO-013', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (14, 1, 1, 2, 5,   'REG-DEMO-014', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (15, 1, 2, 2, 6,   'REG-DEMO-015', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (16, 1, 3, 3, 5,   'REG-DEMO-016', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (17, 1, 4, 3, 6,   'REG-DEMO-017', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (18, 1, 5, 4, 5,   'REG-DEMO-018', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  (19, 1, 6, 4, 7,   'REG-DEMO-019', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now, 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), @seed_now),
  -- Completed Heritage Classic result history. These rows back the visible
  -- Jockey/Horse performance summaries with real completed RaceEntry data.
  (20, 2, 3, 3, 5,   'REG-DEMO-020', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 155 DAY), 1, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  (21, 2, 4, 3, 7,   'REG-DEMO-021', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 155 DAY), 1, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  (22, 2, 5, 4, 6,   'REG-DEMO-022', 'PAID',   'APPROVED',  NULL, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 155 DAY), 1, DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 118 DAY)),
  -- Three fully approved, paid owner/jockey/horse pairs for Race 8.
  (23, 3, 9, 17, 20,  'REG-BET-FLOW-001', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY), 1, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY)),
  (24, 3, 10, 18, 21, 'REG-BET-FLOW-002', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY), 1, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY)),
  (25, 3, 11, 19, 22, 'REG-BET-FLOW-003', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY), 1, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 4 DAY));

INSERT INTO `PaymentTransaction`
  (`paymentTransactionID`, `userID`, `registrationID`, `walletID`, `purpose`, `provider`, `amount`, `currency`, `txnRef`, `providerTransactionNo`, `status`, `payUrl`, `responseCode`, `rawResponse`, `createdAt`, `paidAt`, `updatedAt`)
VALUES
  (1,  2,  1, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-001', 'VNP-SEED-001', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY)),
  (2,  3,  3, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-003', 'VNP-SEED-003', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_SUB(@seed_now, INTERVAL 6 DAY)),
  (3,  3,  4, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-004', 'VNP-SEED-004', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_SUB(@seed_now, INTERVAL 7 DAY), DATE_SUB(@seed_now, INTERVAL 7 DAY)),
  (4,  4,  6, NULL, 'REGISTRATION_FEE', 'VNPAY', 2000000.00, 'VND', 'SEED-REG-006', 'VNP-SEED-006', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 160 DAY)),
  (5,  2,  8, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-008', 'VNP-SEED-008', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (6,  23, 9, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-009', 'VNP-SEED-009', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (7,  24, 10, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-010', 'VNP-SEED-010', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (8,  3, 11, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-011', 'VNP-SEED-011', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (9,  4, 12, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-012', 'VNP-SEED-012', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (10, 4, 13, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-013', 'VNP-SEED-013', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (11, 2, 14, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-014', 'VNP-SEED-014', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (12, 2, 15, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-015', 'VNP-SEED-015', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (13, 3, 16, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-016', 'VNP-SEED-016', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (14, 3, 17, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-017', 'VNP-SEED-017', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (15, 4, 18, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-018', 'VNP-SEED-018', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (16, 4, 19, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-REG-019', 'VNP-SEED-019', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY)),
  (17, 14, NULL, 7, 'WALLET_DEPOSIT',   'VNPAY', 5000000.00, 'VND', 'SEED-WALLET-014', 'VNP-SEED-W014', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (18, 3, 20, NULL, 'REGISTRATION_FEE', 'VNPAY', 2000000.00, 'VND', 'SEED-REG-020', 'VNP-SEED-020', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 160 DAY)),
  (19, 3, 21, NULL, 'REGISTRATION_FEE', 'VNPAY', 2000000.00, 'VND', 'SEED-REG-021', 'VNP-SEED-021', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 160 DAY)),
  (20, 4, 22, NULL, 'REGISTRATION_FEE', 'VNPAY', 2000000.00, 'VND', 'SEED-REG-022', 'VNP-SEED-022', 'SUCCESS', NULL, '00', '{"seed":true}', DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 160 DAY), DATE_SUB(@seed_now, INTERVAL 160 DAY)),
  (21, 17, 23, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-BET-FLOW-REG-001', 'VNP-BET-FLOW-R001', 'SUCCESS', NULL, '00', '{"seed":true,"flow":"bet"}', DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY)),
  (22, 18, 24, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-BET-FLOW-REG-002', 'VNP-BET-FLOW-R002', 'SUCCESS', NULL, '00', '{"seed":true,"flow":"bet"}', DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY)),
  (23, 19, 25, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'SEED-BET-FLOW-REG-003', 'VNP-BET-FLOW-R003', 'SUCCESS', NULL, '00', '{"seed":true,"flow":"bet"}', DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY)),
  (24, 15, NULL, 8, 'WALLET_DEPOSIT', 'VNPAY', 9000000.00, 'VND', 'SEED-WALLET-015', 'VNP-SEED-W015', 'SUCCESS', NULL, '00', '{"seed":true,"initialBalance":9000000}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (25, 16, NULL, 9, 'WALLET_DEPOSIT', 'VNPAY', 9000000.00, 'VND', 'SEED-WALLET-016', 'VNP-SEED-W016', 'SUCCESS', NULL, '00', '{"seed":true,"initialBalance":9000000}', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 2 DAY));

INSERT INTO `SystemFund`
  (`systemFundID`, `balance`, `bettingFeeRevenue`, `createdAt`, `updatedAt`)
VALUES
  (1, 60000.00, 60000.00, DATE_SUB(@seed_now, INTERVAL 2 HOUR), @seed_now);

INSERT INTO `FundTransaction`
  (`fundTransactionID`, `fundKey`, `tournamentID`, `transactionType`, `direction`, `amount`, `balanceBefore`, `balanceAfter`, `referenceType`, `referenceID`, `description`, `createdAt`)
VALUES
  (1, 'SYSTEM', NULL, 'BETTING_OPERATOR_FEE', 'CREDIT', 60000.00, 0.00, 60000.00, 'BET_SETTLEMENT', 1, 'Betting operator fee for Heritage Sprint settlement', DATE_SUB(@seed_now, INTERVAL 2 HOUR));

INSERT INTO `RaceEntry`
  (`raceEntryID`, `raceID`, `registrationID`, `startingStall`, `status`, `assignedAt`, `assignedBy`, `cancelledAt`, `cancelledBy`, `cancellationReason`)
VALUES
  (1, 1, 4, 1, 'ASSIGNED',  DATE_SUB(@seed_now, INTERVAL 2 DAY), 1, NULL, NULL, NULL),
  (2, 2, 3, 2, 'CANCELLED', DATE_SUB(@seed_now, INTERVAL 2 DAY), 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), 1, 'Owner requested reassignment before race start.'),
  (3, 4, 6, 3, 'ASSIGNED',  DATE_SUB(@seed_now, INTERVAL 130 DAY), 1, NULL, NULL, NULL),
  -- Race 6 (Live Test Race) entries: five active stalls, leaving one approved
  -- Registration unassigned so Admin can demonstrate assigning the final slot.
  (4, 6, 8, 1, 'ASSIGNED',  @seed_now, 1, NULL, NULL, NULL),
  (5, 6, 11, 2, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (6, 6, 12, 3, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (7, 6, 9, 4, 'ASSIGNED',  @seed_now, 1, NULL, NULL, NULL),
  (8, 6, 10, 5, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  -- Race 5 (Heritage Classic) entries for completed result history.
  (9, 5, 20, 1, 'ASSIGNED', DATE_SUB(@seed_now, INTERVAL 130 DAY), 1, NULL, NULL, NULL),
  (13, 5, 21, 2, 'ASSIGNED', DATE_SUB(@seed_now, INTERVAL 130 DAY), 1, NULL, NULL, NULL),
  (14, 5, 22, 3, 'ASSIGNED', DATE_SUB(@seed_now, INTERVAL 130 DAY), 1, NULL, NULL, NULL),
  -- Race 7 (Betting Demo Sprint) entries: three unique owner/jockey
  -- assignments for betting tickets and race result display.
  (10, 7, 14, 1, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (11, 7, 17, 2, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  (12, 7, 19, 3, 'ASSIGNED', @seed_now, 1, NULL, NULL, NULL),
  -- Race 8: minimum three active runners, all unique owner/jockey/horse pairs.
  (15, 8, 23, 1, 'ASSIGNED', DATE_SUB(@seed_now, INTERVAL 1 HOUR), 1, NULL, NULL, NULL),
  (16, 8, 24, 2, 'ASSIGNED', DATE_SUB(@seed_now, INTERVAL 1 HOUR), 1, NULL, NULL, NULL),
  (17, 8, 25, 3, 'ASSIGNED', DATE_SUB(@seed_now, INTERVAL 1 HOUR), 1, NULL, NULL, NULL);

INSERT INTO `BetProduct`
  (`betProductID`, `code`, `name`, `description`, `minStake`, `maxDailyStake`, `operatorFeeRate`, `active`, `createdAt`, `updatedAt`)
VALUES
  (1, 'WIN', 'Top 1', 'Pick the horse that finishes in first place.', 10000.00, 1000000.00, 0.1000, true, @seed_now, @seed_now),
  (2, 'PLACE', 'Top 3', 'Pick a horse that finishes in the first three places.', 10000.00, 1000000.00, 0.1000, true, @seed_now, @seed_now);

INSERT INTO `BetEvent`
  (`betEventID`, `raceID`, `betProductID`, `status`, `openAt`, `closeAt`, `operatorFeeRate`, `createdBy`, `settledBy`, `settledAt`, `createdAt`, `updatedAt`)
VALUES
  (1, 7, 1, 'OPEN', DATE_SUB(@seed_now, INTERVAL 1 HOUR), DATE_ADD(@seed_now, INTERVAL 355 MINUTE), 0.1000, 1, NULL, NULL, @seed_now, @seed_now),
  (2, 7, 2, 'OPEN', DATE_SUB(@seed_now, INTERVAL 1 HOUR), DATE_ADD(@seed_now, INTERVAL 355 MINUTE), 0.1000, 1, NULL, NULL, @seed_now, @seed_now),
  (3, 4, 1, 'SETTLED', DATE_SUB(@seed_now, INTERVAL 5 HOUR), DATE_SUB(@seed_now, INTERVAL 3 HOUR), 0.1000, 1, 1, DATE_SUB(@seed_now, INTERVAL 2 HOUR), DATE_SUB(@seed_now, INTERVAL 5 HOUR), DATE_SUB(@seed_now, INTERVAL 2 HOUR)),
  -- Closed and not settled, with official RaceResult below, so Admin can test the manual Settle action.
  (4, 4, 2, 'CLOSED', DATE_SUB(@seed_now, INTERVAL 4 HOUR), DATE_SUB(@seed_now, INTERVAL 2 HOUR), 0.1000, 1, NULL, NULL, DATE_SUB(@seed_now, INTERVAL 4 HOUR), DATE_SUB(@seed_now, INTERVAL 2 HOUR));

INSERT INTO `BetSettlement`
  (`betSettlementID`, `betEventID`, `totalStake`, `winningStake`, `losingStake`, `operatorFee`, `payoutPool`, `settledBy`, `settledAt`)
VALUES
  (1, 3, 600000.00, 200000.00, 400000.00, 60000.00, 540000.00, 1, DATE_SUB(@seed_now, INTERVAL 2 HOUR));

UPDATE `BetSettlement`
SET `grossPool` = `totalStake`,
    `netPool` = `payoutPool`,
    `rawOdds` = ROUND(`payoutPool` / `winningStake`, 4),
    `minimumOdds` = 1.0500,
    `finalOdds` = GREATEST(ROUND(`payoutPool` / `winningStake`, 4), 1.0500),
    `totalPayout` = `payoutPool`,
    `subsidyAmount` = 0,
    `roundingAdjustment` = 0,
    `outcome` = 'PAID'
WHERE `betSettlementID` = 1;

INSERT INTO `BetTicket`
  (`betTicketID`, `betEventID`, `userID`, `walletID`, `raceID`, `raceEntryID`, `stake`, `estimatedOddsAtBet`, `finalOdds`, `payoutAmount`, `status`, `placedAt`, `settledAt`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 14, 7, 7, 10, 200000.00, 1.0000, NULL, NULL, 'PLACED', DATE_SUB(@seed_now, INTERVAL 30 MINUTE), NULL, DATE_SUB(@seed_now, INTERVAL 30 MINUTE), DATE_SUB(@seed_now, INTERVAL 30 MINUTE)),
  (2, 1, 14, 7, 7, 11, 150000.00, 2.2000, NULL, NULL, 'PLACED', DATE_SUB(@seed_now, INTERVAL 20 MINUTE), NULL, DATE_SUB(@seed_now, INTERVAL 20 MINUTE), DATE_SUB(@seed_now, INTERVAL 20 MINUTE)),
  (3, 2, 14, 7, 7, 12, 250000.00, 1.0000, NULL, NULL, 'PLACED', DATE_SUB(@seed_now, INTERVAL 10 MINUTE), NULL, DATE_SUB(@seed_now, INTERVAL 10 MINUTE), DATE_SUB(@seed_now, INTERVAL 10 MINUTE)),
  (4, 4, 14, 7, 4, 3, 200000.00, 1.0000, NULL, NULL, 'PLACED', DATE_SUB(@seed_now, INTERVAL 90 MINUTE), NULL, DATE_SUB(@seed_now, INTERVAL 90 MINUTE), DATE_SUB(@seed_now, INTERVAL 90 MINUTE)),
  -- spectator1 has one active bet; spectator2 intentionally has no BetTicket.
  (5, 1, 15, 8, 7, 10, 300000.00, 1.6250, NULL, NULL, 'PLACED', DATE_SUB(@seed_now, INTERVAL 5 MINUTE), NULL, DATE_SUB(@seed_now, INTERVAL 5 MINUTE), DATE_SUB(@seed_now, INTERVAL 5 MINUTE));

INSERT INTO `WalletTransaction`
  (`walletTransactionID`, `walletID`, `userID`, `type`, `amount`, `balanceBefore`, `balanceAfter`, `lockedBefore`, `lockedAfter`, `referenceType`, `referenceID`, `description`, `createdAt`)
VALUES
  (1, 7, 14, 'DEPOSIT',  5000000.00,       0.00, 5000000.00,      0.00,      0.00, 'PAYMENT_TRANSACTION', 17, 'Seed wallet deposit', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (2, 7, 14, 'BET_LOCK',  200000.00, 5000000.00, 5000000.00,      0.00, 200000.00, 'BET_TICKET', 1, 'Lock stake for betting ticket', DATE_SUB(@seed_now, INTERVAL 30 MINUTE)),
  (3, 7, 14, 'BET_LOCK',  150000.00, 5000000.00, 5000000.00, 200000.00, 350000.00, 'BET_TICKET', 2, 'Lock stake for betting ticket', DATE_SUB(@seed_now, INTERVAL 20 MINUTE)),
  (4, 7, 14, 'BET_LOCK',  250000.00, 5000000.00, 5000000.00, 350000.00, 600000.00, 'BET_TICKET', 3, 'Lock stake for betting ticket', DATE_SUB(@seed_now, INTERVAL 10 MINUTE)),
  (5, 7, 14, 'BET_LOCK',  200000.00, 5000000.00, 5000000.00, 600000.00, 800000.00, 'BET_TICKET', 4, 'Lock stake for settlement demo ticket', DATE_SUB(@seed_now, INTERVAL 90 MINUTE)),
  (6, 8, 15, 'DEPOSIT',  9000000.00,       0.00, 9000000.00,      0.00,      0.00, 'PAYMENT_TRANSACTION', 24, 'Seed initial 9,000,000 VND for spectator1', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (7, 9, 16, 'DEPOSIT',  9000000.00,       0.00, 9000000.00,      0.00,      0.00, 'PAYMENT_TRANSACTION', 25, 'Seed initial 9,000,000 VND for spectator2', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
  (8, 8, 15, 'BET_LOCK',  300000.00, 9000000.00, 9000000.00,      0.00, 300000.00, 'BET_TICKET', 5, 'Lock spectator1 stake for the active betting demo', DATE_SUB(@seed_now, INTERVAL 5 MINUTE));

INSERT INTO `RaceResult`
  (`resultID`, `raceEntryID`, `finishPosition`, `finishTime`, `prizeMoney`, `recordedAt`, `recordedBy`)
VALUES
  (1, 3,  1, '00:01:12.450', 40000000.00, DATE_SUB(@seed_now, INTERVAL 120 DAY), 8),
  (2, 9,  1, '00:01:47.820', 60000000.00, DATE_SUB(@seed_now, INTERVAL 119 DAY), 9),
  (3, 13, 2, '00:01:50.360', 36000000.00, DATE_SUB(@seed_now, INTERVAL 119 DAY), 9),
  (4, 14, 3, '00:01:52.910', 24000000.00, DATE_SUB(@seed_now, INTERVAL 119 DAY), 9);

INSERT INTO `PrizeDistribution`
  (`prizeDistributionID`, `raceID`, `raceEntryID`, `racePrizeID`, `ownerID`, `jockeyID`, `totalPrize`, `ownerAmount`, `jockeyAmount`, `status`, `distributedAt`, `createdAt`)
VALUES
  (1, 4, 3,  10, 4, 6, 40000000.00, 32000000.00,  8000000.00, 'PENDING', NULL, DATE_SUB(@seed_now, INTERVAL 120 DAY)),
  (2, 5, 9,  13, 3, 5, 60000000.00, 48000000.00, 12000000.00, 'PENDING', NULL, DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  (3, 5, 13, 14, 3, 7, 36000000.00, 28800000.00,  7200000.00, 'PENDING', NULL, DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  (4, 5, 14, 15, 4, 6, 24000000.00, 19200000.00,  4800000.00, 'PENDING', NULL, DATE_SUB(@seed_now, INTERVAL 119 DAY));

INSERT INTO `HorsePerformanceSummary`
  (`horseID`, `totalRaces`, `top1Count`, `top2Count`, `top3Count`, `violationCount`, `disqualifiedCount`, `lastUpdatedAt`)
VALUES
  (1, 0,  0, 0, 0, 0, 0, @seed_now),
  (2, 0,  0, 0, 0, 0, 0, @seed_now),
  (3, 1,  1, 0, 0, 0, 0, DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  (4, 1,  0, 1, 0, 0, 0, DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  (5, 1,  0, 0, 1, 0, 0, DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  (6, 1,  1, 0, 0, 0, 0, DATE_SUB(@seed_now, INTERVAL 120 DAY)),
  (7, 0,  0, 0, 0, 0, 0, @seed_now),
  (8, 0,  0, 0, 0, 0, 0, @seed_now),
  (9, 0,  0, 0, 0, 0, 0, @seed_now),
  (10, 0, 0, 0, 0, 0, 0, @seed_now),
  (11, 0, 0, 0, 0, 0, 0, @seed_now),
  (12, 0, 0, 0, 0, 0, 0, @seed_now),
  (13, 0, 0, 0, 0, 0, 0, @seed_now);

INSERT INTO `JockeyPerformanceSummary`
  (`jockeyID`, `totalRaces`, `top1Count`, `top2Count`, `top3Count`, `winRate`, `violationCount`, `disqualifiedCount`, `lastUpdatedAt`)
VALUES
  (5, 1, 1, 0, 0, 100.00, 0, 0, DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  (6, 2, 1, 0, 1, 50.00,  0, 0, DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  (7, 1, 0, 1, 0, 0.00,   0, 0, DATE_SUB(@seed_now, INTERVAL 119 DAY)),
  (20, 0, 0, 0, 0, 0.00, 0, 0, @seed_now),
  (21, 0, 0, 0, 0, 0.00, 0, 0, @seed_now),
  (22, 0, 0, 0, 0, 0.00, 0, 0, @seed_now),
  (25, 0, 0, 0, 0, 0.00, 0, 0, @seed_now),
  (26, 0, 0, 0, 0, 0.00, 0, 0, @seed_now);

INSERT INTO `RefereeAssignment`
  (`assignmentID`, `raceID`, `refereeUserID`, `assignedAt`, `status`)
VALUES
  (1, 1, 8, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (2, 2, 9, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (3, 3, 8, DATE_SUB(@seed_now, INTERVAL 2 DAY),   'ASSIGNED'),
  (4, 4, 8, DATE_SUB(@seed_now, INTERVAL 130 DAY), 'COMPLETED'),
  (5, 5, 9, DATE_SUB(@seed_now, INTERVAL 130 DAY), 'COMPLETED'),
  -- Required by RaceEngineLaunchService after Race 8 is marked READY.
  (6, 8, 8, DATE_SUB(@seed_now, INTERVAL 1 HOUR), 'ASSIGNED');

INSERT INTO `JockeyInvitation`
  (`invitationID`, `registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `status`, `message`, `createdAt`, `expiredAt`, `respondedAt`)
VALUES
  (1, 1, 1, 1, 2, 5, 'ACCEPTED', 'Please ride Demo Thunder in the Future Championship.', DATE_SUB(@seed_now, INTERVAL 6 DAY), DATE_ADD(@seed_now, INTERVAL 2 DAY), DATE_SUB(@seed_now, INTERVAL 5 DAY)),
  (2, 2, 1, 2, 2, 6, 'PENDING',  'Invitation to partner with Demo Comet.', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 7 DAY), NULL),
  (3, 3, 1, 3, 3, 6, 'ACCEPTED', 'Accepted invitation for an approved Registration.', DATE_SUB(@seed_now, INTERVAL 8 DAY), DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 7 DAY));

COMMIT;

-- Expected row counts after a successful import.
-- On a fresh database:
--   spectator1@horse.test -> Wallet 8, balance 9,000,000, locked 300,000,
--                            one PLACED ticket on the existing OPEN Race 7 event.
--   spectator2@horse.test -> Wallet 9, balance 9,000,000, locked 0,
--                            no BetTicket rows.
--   Race 8 -> ENTRIES_FINALIZED, three ASSIGNED entries, referee assigned,
--             and zero BetEvent rows (Admin betting setup starting point).
SELECT 'Roles' AS `tableName`, COUNT(*) AS `rowCount` FROM `Roles`
UNION ALL SELECT 'Users', COUNT(*) FROM `Users`
UNION ALL SELECT 'OwnerApplication', COUNT(*) FROM `OwnerApplication`
UNION ALL SELECT 'OwnerProfile', COUNT(*) FROM `OwnerProfile`
UNION ALL SELECT 'user_verifications', COUNT(*) FROM `user_verifications`
UNION ALL SELECT 'Wallet', COUNT(*) FROM `Wallet`
UNION ALL SELECT 'SystemFund', COUNT(*) FROM `SystemFund`
UNION ALL SELECT 'FundTransaction', COUNT(*) FROM `FundTransaction`
UNION ALL SELECT 'Horse', COUNT(*) FROM `Horse`
UNION ALL SELECT 'JockeyProfile', COUNT(*) FROM `JockeyProfile`
UNION ALL SELECT 'JockeyVerification', COUNT(*) FROM `JockeyVerification`
UNION ALL SELECT 'JockeyVerificationFile', COUNT(*) FROM `JockeyVerificationFile`
UNION ALL SELECT 'Tournament', COUNT(*) FROM `Tournament`
UNION ALL SELECT 'TournamentCondition', COUNT(*) FROM `TournamentCondition`
UNION ALL SELECT 'Race', COUNT(*) FROM `Race`
UNION ALL SELECT 'RacePrize', COUNT(*) FROM `RacePrize`
UNION ALL SELECT 'Registration', COUNT(*) FROM `Registration`
UNION ALL SELECT 'PaymentTransaction', COUNT(*) FROM `PaymentTransaction`
UNION ALL SELECT 'RaceEntry', COUNT(*) FROM `RaceEntry`
UNION ALL SELECT 'BetProduct', COUNT(*) FROM `BetProduct`
UNION ALL SELECT 'BetEvent', COUNT(*) FROM `BetEvent`
UNION ALL SELECT 'BetTicket', COUNT(*) FROM `BetTicket`
UNION ALL SELECT 'BetSettlement', COUNT(*) FROM `BetSettlement`
UNION ALL SELECT 'WalletTransaction', COUNT(*) FROM `WalletTransaction`
UNION ALL SELECT 'RaceResult', COUNT(*) FROM `RaceResult`
UNION ALL SELECT 'PrizeDistribution', COUNT(*) FROM `PrizeDistribution`
UNION ALL SELECT 'HorsePerformanceSummary', COUNT(*) FROM `HorsePerformanceSummary`
UNION ALL SELECT 'JockeyPerformanceSummary', COUNT(*) FROM `JockeyPerformanceSummary`
UNION ALL SELECT 'RefereeAssignment', COUNT(*) FROM `RefereeAssignment`
UNION ALL SELECT 'JockeyInvitation', COUNT(*) FROM `JockeyInvitation`;
