USE `horse_racing_system`;

-- Full project presentation data.
-- Run once immediately after team_schema.sql on a fresh database.
-- Login password for every seeded account: 123456
--
-- Scenario goal:
-- 1 Tournament + 1 Race.
-- Race starts about 60 minutes after import so there is enough time for
-- owner/jockey/registration/betting setup before launch.
-- entryFinalizationScheduledAt is seeded in the past for presentation speed;
-- in real create/edit flow it must be at least 2 days before raceStartTime.
-- Two APPROVED + PAID registrations are already waiting in the RaceEntry queue.
-- During presentation:
--   1. Register owner@gmail.com as Owner, then Admin approves the Owner application.
--   2. Owner creates a Horse, then Admin approves the Horse.
--   3. Register jockey@gmail.com as Jockey, then Admin approves the Jockey verification.
--   4. Approved Owner invites approved Jockey for the new Horse and this Tournament.
--   5. Jockey accepts invitation, Owner pays registration fee, then Admin approves it.
--   6. Assign all 3 RaceEntries.
--   7. Login as spectator@gmail.com, complete KYC, deposit wallet balance, then place a bet.
--   8. Open the prepared DRAFT betting event after at least 2 RaceEntries are assigned.
--   9. Assign/verify Referee.
--   10. Near launch time, edit Race.raceStartTime/BetEvent.closeAt in MySQL Workbench if needed.
--   11. Mark Race READY if needed and launch Unity.
--   12. Unity submits provisional result.
--   13. Referee confirms result.
--   14. Admin approves final result.
--   15. Official RaceResult + PrizeDistribution are created, then Admin can settle betting.
--
-- Backup accounts if the long onboarding/KYC flow is not completed in time:
--   ownerminh@gmail.com owns Minh Comet and is already approved.
--   jockeyminh@gmail.com is already approved.
--   spectatorminh@gmail.com already has VERIFIED KYC and wallet balance.

SET @seed_now = NOW();
SET @seed_today = CURDATE();
SET @seed_password = '$2a$10$Ieulp7E7sedpTVjs0DGXfu2/Tv74cxORzfH0ZuOgr.DRNPsc5o1te';

START TRANSACTION;

-- Roles are created by team_schema.sql. These fixed user IDs keep presentation steps easy to explain.
INSERT INTO `Users`
  (`userID`, `roleID`, `accountType`, `username`, `email`, `password`, `phone`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 'ADMIN',   'admin',   'admin@gmail.com',        @seed_password, '0900000001', 'ACTIVE', @seed_now, @seed_now),
  (2, 2, 'OWNER',   'ownerhuy',  'ownerhuy@gmail.com',  @seed_password, '0900000002', 'ACTIVE', @seed_now, @seed_now),
  (3, 2, 'OWNER',   'ownerkhoa', 'ownerkhoa@gmail.com', @seed_password, '0900000003', 'ACTIVE', @seed_now, @seed_now),
  (4, 3, 'JOCKEY',  'jockeynam', 'jockeynam@gmail.com', @seed_password, '0900000004', 'ACTIVE', @seed_now, @seed_now),
  (5, 3, 'JOCKEY',  'jockeybao', 'jockeybao@gmail.com', @seed_password, '0900000005', 'ACTIVE', @seed_now, @seed_now),
  (6, 4, 'REFEREE', 'referee', 'referee@gmail.com', @seed_password, '0900000006', 'ACTIVE', @seed_now, @seed_now),
  (7, 5, 'SPECTATOR', 'spectator', 'spectator@gmail.com', @seed_password, '0900000007', 'ACTIVE', @seed_now, @seed_now),
  (8, 5, 'OWNER', 'owner', 'owner@gmail.com', @seed_password, '0900000008', 'ACTIVE', @seed_now, @seed_now),
  (9, 5, 'JOCKEY', 'jockey', 'jockey@gmail.com', @seed_password, '0900000009', 'ACTIVE', @seed_now, @seed_now),
  (10, 2, 'OWNER', 'ownerminh', 'ownerminh@gmail.com', @seed_password, '0900000010', 'ACTIVE', @seed_now, @seed_now),
  (11, 3, 'JOCKEY', 'jockeyminh', 'jockeyminh@gmail.com', @seed_password, '0900000011', 'ACTIVE', @seed_now, @seed_now),
  (12, 5, 'SPECTATOR', 'spectatorminh', 'spectatorminh@gmail.com', @seed_password, '0900000012', 'ACTIVE', @seed_now, @seed_now);

INSERT INTO `user_verifications`
  (`verification_id`, `user_id`, `provider`, `provider_session_id`, `provider_session_number`, `workflow_id`, `vendor_data`, `verification_url`, `status`, `id_verification_status`, `liveness_status`, `face_match_status`, `verified_full_name`, `verified_date_of_birth`, `document_type`, `document_last_four`, `attempt_number`, `submitted_at`, `verified_at`, `expires_at`, `created_at`, `updated_at`)
VALUES
  (1, 2, 'DIDIT', 'kyc-owner-huy', 2, 'identity-verification', 'owner-huy', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Owner Huy', DATE_SUB(@seed_today, INTERVAL 35 YEAR), 'ID_CARD', '0002', 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), DATE_SUB(@seed_now, INTERVAL 39 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 40 DAY), DATE_SUB(@seed_now, INTERVAL 39 DAY)),
  (2, 3, 'DIDIT', 'kyc-owner-khoa',  3, 'identity-verification', 'owner-khoa',  NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Owner Khoa',  DATE_SUB(@seed_today, INTERVAL 38 YEAR), 'ID_CARD', '0003', 1, DATE_SUB(@seed_now, INTERVAL 40 DAY), DATE_SUB(@seed_now, INTERVAL 39 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 40 DAY), DATE_SUB(@seed_now, INTERVAL 39 DAY)),
  (3, 10, 'DIDIT', 'kyc-owner-minh', 10, 'identity-verification', 'owner-minh', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Owner Minh', DATE_SUB(@seed_today, INTERVAL 34 YEAR), 'ID_CARD', '0010', 1, DATE_SUB(@seed_now, INTERVAL 10 DAY), DATE_SUB(@seed_now, INTERVAL 9 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 10 DAY), DATE_SUB(@seed_now, INTERVAL 9 DAY)),
  (4, 11, 'DIDIT', 'kyc-jockey-minh', 11, 'identity-verification', 'jockey-minh', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Jockey Minh', DATE_SUB(@seed_today, INTERVAL 26 YEAR), 'ID_CARD', '0011', 1, DATE_SUB(@seed_now, INTERVAL 10 DAY), DATE_SUB(@seed_now, INTERVAL 9 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 10 DAY), DATE_SUB(@seed_now, INTERVAL 9 DAY)),
  (5, 12, 'DIDIT', 'kyc-spectator-minh', 12, 'identity-verification', 'spectator-minh', NULL, 'VERIFIED', 'Approved', 'Approved', 'Approved', 'Spectator Minh', DATE_SUB(@seed_today, INTERVAL 29 YEAR), 'ID_CARD', '0012', 1, DATE_SUB(@seed_now, INTERVAL 10 DAY), DATE_SUB(@seed_now, INTERVAL 9 DAY), DATE_ADD(@seed_now, INTERVAL 5 YEAR), DATE_SUB(@seed_now, INTERVAL 10 DAY), DATE_SUB(@seed_now, INTERVAL 9 DAY));

INSERT INTO `OwnerApplication`
  (`applicationID`, `userID`, `stableName`, `stableAddress`, `stableCertificateUrl`, `totalHorsesOwned`, `horseOwnershipProofUrl`, `status`, `rejectReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 2, 'Huy Racing Stable',  'Bangkok Stable District', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/huy-stable-certificate.pdf',  1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/huy-horse-ownership.pdf',  'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY)),
  (2, 3, 'Khoa Racing Stable', 'Chiang Mai Stable Road',     'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/khoa-stable-certificate.pdf', 1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/khoa-horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY), 1, DATE_SUB(@seed_now, INTERVAL 35 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY)),
  (3, 10, 'Minh Racing Stable', 'Bangkok Riverside Stable', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/minh-stable-certificate.pdf', 1, 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/minh-horse-ownership.pdf', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 8 DAY), 1, DATE_SUB(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 8 DAY));

INSERT INTO `OwnerProfile`
  (`ownerID`, `applicationID`, `createdAt`, `updatedAt`)
VALUES
  (2, 1, DATE_SUB(@seed_now, INTERVAL 34 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY)),
  (3, 2, DATE_SUB(@seed_now, INTERVAL 34 DAY), DATE_SUB(@seed_now, INTERVAL 34 DAY)),
  (10, 3, DATE_SUB(@seed_now, INTERVAL 8 DAY), DATE_SUB(@seed_now, INTERVAL 8 DAY));

INSERT INTO `JockeyProfile`
  (`jockeyID`, `fullName`, `weight`, `biography`, `totalRaces`, `totalWins`, `createdAt`, `updatedAt`)
VALUES
  (4, 'Jockey Nam',   52.50, 'Professional jockey specializing in sprint races.', 42, 12, DATE_SUB(@seed_now, INTERVAL 90 DAY), @seed_now),
  (5, 'Jockey Bao',   54.00, 'Professional jockey with strong middle-distance experience.', 37, 9, DATE_SUB(@seed_now, INTERVAL 90 DAY), @seed_now),
  (11, 'Jockey Minh', 53.00, 'Approved jockey available for the registration flow.', 18, 4, DATE_SUB(@seed_now, INTERVAL 9 DAY), @seed_now);

INSERT INTO `JockeyVerification`
  (`verificationID`, `jockeyID`, `trainerName`, `trainerEmail`, `academyStableAddress`, `issuingAuthority`, `verificationLink`, `licenceType`, `expiryDate`, `weight`, `biography`, `verificationStatus`, `rejectionReason`, `resubmitCount`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 4, 'Trainer An',   'trainer.an@gmail.com',   'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-nam-verification.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 52.50, 'Approved jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 80 DAY), DATE_SUB(@seed_now, INTERVAL 79 DAY), 1, DATE_SUB(@seed_now, INTERVAL 80 DAY), DATE_SUB(@seed_now, INTERVAL 79 DAY)),
  (2, 5, 'Trainer Binh', 'trainer.binh@gmail.com', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-bao-verification.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 54.00, 'Approved jockey.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 80 DAY), DATE_SUB(@seed_now, INTERVAL 79 DAY), 1, DATE_SUB(@seed_now, INTERVAL 80 DAY), DATE_SUB(@seed_now, INTERVAL 79 DAY)),
  (3, 11, 'Trainer Minh', 'trainer.minh@gmail.com', 'Bangkok Racing Academy', 'Thailand Racing Authority', 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/jockey-minh-verification.pdf', 'PROFESSIONAL', DATE_ADD(@seed_today, INTERVAL 2 YEAR), 53.00, 'Approved jockey for recovery flow.', 'APPROVED', NULL, 0, DATE_SUB(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 8 DAY), 1, DATE_SUB(@seed_now, INTERVAL 9 DAY), DATE_SUB(@seed_now, INTERVAL 8 DAY));

INSERT INTO `JockeyVerificationFile`
  (`fileID`, `verificationID`, `fileUrl`, `fileType`, `uploadedAt`)
VALUES
  (1, 1, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 80 DAY)),
  (2, 2, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 80 DAY)),
  (3, 3, 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=900&q=80', 'IMAGE', DATE_SUB(@seed_now, INTERVAL 9 DAY));

INSERT INTO `Wallet`
  (`walletID`, `userID`, `balance`, `lockedBalance`, `currency`, `status`, `createdAt`, `updatedAt`)
VALUES
  (1, 2, 0.00, 0.00, 'VND', 'ACTIVE', @seed_now, @seed_now),
  (2, 3, 0.00, 0.00, 'VND', 'ACTIVE', @seed_now, @seed_now),
  (3, 4, 0.00, 0.00, 'VND', 'ACTIVE', @seed_now, @seed_now),
  (4, 5, 0.00, 0.00, 'VND', 'ACTIVE', @seed_now, @seed_now),
  (5, 10, 0.00, 0.00, 'VND', 'ACTIVE', @seed_now, @seed_now),
  (6, 11, 0.00, 0.00, 'VND', 'ACTIVE', @seed_now, @seed_now),
  (7, 12, 2000000.00, 0.00, 'VND', 'ACTIVE', @seed_now, @seed_now);

INSERT INTO `Horse`
  (`horseID`, `ownerID`, `horseName`, `age`, `dayOfBirth`, `weight`, `colour`, `sex`, `breeding`, `trainer`, `healthCertExpiry`, `healthCertificateUrl`, `officialHorseProfileUrl`, `status`, `rejectionReason`, `createdAt`, `updatedAt`)
VALUES
  (1, 2, 'Saigon Thunder', 4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 480.00, 'Bay',      'MALE', 'Thoroughbred', 'Trainer An', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/saigon-thunder-health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/saigon-thunder', 'ACTIVE', NULL, @seed_now, @seed_now),
  (2, 3, 'Mekong Blaze',   5, DATE_SUB(@seed_today, INTERVAL 5 YEAR), 496.00, 'Chestnut', 'MALE', 'Thoroughbred', 'Trainer Binh', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/mekong-blaze-health.pdf',   'https://www.racingandsports.com.au/thoroughbred/horse/mekong-blaze',   'ACTIVE', NULL, @seed_now, @seed_now),
  (3, 10, 'Minh Comet', 4, DATE_SUB(@seed_today, INTERVAL 4 YEAR), 502.00, 'Black',    'MALE', 'Thoroughbred', 'Trainer Minh', DATE_ADD(@seed_today, INTERVAL 1 YEAR), 'https://res.cloudinary.com/dxuyde8yr/raw/upload/v1710000000/documents/minh-comet-health.pdf', 'https://www.racingandsports.com.au/thoroughbred/horse/minh-comet', 'ACTIVE', NULL, @seed_now, @seed_now);

INSERT INTO `Tournament`
  (`tournamentID`, `tournamentName`, `venue`, `venueImageUrl`, `description`, `registrationOpenAt`, `registrationCloseAt`, `startDate`, `endDate`, `maxRegistrations`, `entryFee`, `status`, `createdBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 'Bangkok Unity Cup', 'Bangkok Equestrian Park', 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80', 'Official Tournament for owner registration, admin approval, RaceEntry assignment, Unity run, Referee review, Admin final approval, and prize split.', DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 1 DAY), @seed_today, @seed_today, 12, 1000000.00, 'OPEN_FOR_REGISTRATION', 1, @seed_now, @seed_now);

INSERT INTO `TournamentCondition`
  (`conditionID`, `tournamentID`, `conditionType`, `operator`, `minValue`, `maxValue`, `value`)
VALUES
  (1, 1, 'AGE',    'BETWEEN', 3.00, 10.00, NULL),
  (2, 1, 'WEIGHT', 'LTE',     NULL, NULL, '560'),
  (3, 1, 'GENDER', 'EQ',      NULL, NULL, 'MALE');

INSERT INTO `Race`
  (`raceID`, `tournamentID`, `raceName`, `trackName`, `trackImageUrl`, `raceStartTime`, `raceEndTime`, `entryFinalizationScheduledAt`, `entryFinalizedAt`, `entryFinalizedBy`, `distance`, `maxRunners`, `raceOrder`, `status`, `runTriggeredBy`, `runStartedAt`, `raceEngineToken`, `raceEngineTokenIssuedAt`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 'Bangkok Sprint', 'Bangkok Track A', 'https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&w=1200&q=80', DATE_ADD(@seed_now, INTERVAL 60 MINUTE), DATE_ADD(@seed_now, INTERVAL 120 MINUTE), DATE_SUB(@seed_now, INTERVAL 3 DAY), NULL, NULL, 1200, 6, 1, 'OPEN_FOR_REGISTRATION', NULL, NULL, NULL, NULL, @seed_now, @seed_now);

INSERT INTO `RacePrize`
  (`racePrizeID`, `raceID`, `rankPosition`, `amount`, `ownerPercent`, `jockeyPercent`)
VALUES
  (1, 1, 1, 20000000.00, 80.00, 20.00),
  (2, 1, 2, 12000000.00, 80.00, 20.00),
  (3, 1, 3, 8000000.00,  80.00, 20.00);

INSERT INTO `Registration`
  (`registrationID`, `tournamentID`, `horseID`, `ownerID`, `jockeyID`, `registrationNo`, `paymentStatus`, `approvalStatus`, `rejectionReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 1, 2, 4, 'REG-PRESENT-001', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 12 HOUR), 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 12 HOUR)),
  (2, 1, 2, 3, 5, 'REG-PRESENT-002', 'PAID', 'APPROVED', NULL, DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 12 HOUR), 1, DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 12 HOUR));

INSERT INTO `PaymentTransaction`
  (`paymentTransactionID`, `userID`, `registrationID`, `walletID`, `purpose`, `provider`, `amount`, `currency`, `txnRef`, `providerTransactionNo`, `status`, `payUrl`, `responseCode`, `rawResponse`, `createdAt`, `paidAt`, `updatedAt`)
VALUES
  (1, 2, 1, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'PRESENT-REG-001', 'VNP-PRESENT-001', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=1', '00', '{"source":"presentation"}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 23 HOUR), @seed_now),
  (2, 3, 2, NULL, 'REGISTRATION_FEE', 'VNPAY', 1000000.00, 'VND', 'PRESENT-REG-002', 'VNP-PRESENT-002', 'SUCCESS', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=2', '00', '{"source":"presentation"}', DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_SUB(@seed_now, INTERVAL 23 HOUR), @seed_now);

INSERT INTO `TournamentFund`
  (`tournamentID`, `collectedAmount`, `paidPrizeAmount`, `availableBalance`, `createdAt`, `updatedAt`)
VALUES
  (1, 2000000.00, 0.00, 2000000.00, @seed_now, @seed_now);

INSERT INTO `BetProduct`
  (`betProductID`, `code`, `name`, `description`, `minStake`, `maxDailyStake`, `operatorFeeRate`, `active`, `createdAt`, `updatedAt`)
VALUES
  (1, 'WIN', 'Win Bet', 'Pick the winning RaceEntry.', 10000.00, 1000000.00, 0.1000, true, @seed_now, @seed_now);

INSERT INTO `BetEvent`
  (`betEventID`, `raceID`, `betProductID`, `status`, `openAt`, `closeAt`, `operatorFeeRate`, `createdBy`, `settledBy`, `settledAt`, `createdAt`, `updatedAt`)
VALUES
  (1, 1, 1, 'DRAFT', @seed_now, DATE_ADD(@seed_now, INTERVAL 55 MINUTE), 0.1000, 1, NULL, NULL, @seed_now, @seed_now);

INSERT INTO `RefereeAssignment`
  (`assignmentID`, `raceID`, `refereeUserID`, `assignedAt`, `status`)
VALUES
  (1, 1, 6, @seed_now, 'ASSIGNED');

-- The live owner and jockey candidate accounts start clean:
-- owner@gmail.com has no OwnerApplication, no OwnerProfile, and no Horse.
-- jockey@gmail.com has no JockeyVerification and no JockeyProfile.
-- During presentation, approve both accounts, create/approve the Horse,
-- invite the approved Jockey, accept, pay, then let Admin approve the new
-- Registration to create the third runner.
--
-- The live spectator account also starts clean:
-- spectator@gmail.com has no KYC row and no Wallet row. During presentation,
-- complete Didit KYC first; the backend opens the wallet after successful KYC.
-- Then deposit wallet balance before placing a bet.
--
-- Backup path:
-- If long onboarding or Didit KYC is not completed in time, use ownerminh@gmail.com +
-- jockeyminh@gmail.com for the third Registration and spectatorminh@gmail.com for betting.

COMMIT;

-- Expected row counts for this presentation dataset.
SELECT 'Users' AS `tableName`, COUNT(*) AS `rowCount` FROM `Users`
UNION ALL SELECT 'OwnerApplication', COUNT(*) FROM `OwnerApplication`
UNION ALL SELECT 'OwnerProfile', COUNT(*) FROM `OwnerProfile`
UNION ALL SELECT 'JockeyProfile', COUNT(*) FROM `JockeyProfile`
UNION ALL SELECT 'Horse', COUNT(*) FROM `Horse`
UNION ALL SELECT 'Tournament', COUNT(*) FROM `Tournament`
UNION ALL SELECT 'TournamentCondition', COUNT(*) FROM `TournamentCondition`
UNION ALL SELECT 'Race', COUNT(*) FROM `Race`
UNION ALL SELECT 'RacePrize', COUNT(*) FROM `RacePrize`
UNION ALL SELECT 'Registration', COUNT(*) FROM `Registration`
UNION ALL SELECT 'RaceEntry', COUNT(*) FROM `RaceEntry`
UNION ALL SELECT 'RefereeAssignment', COUNT(*) FROM `RefereeAssignment`
UNION ALL SELECT 'JockeyInvitation', COUNT(*) FROM `JockeyInvitation`
UNION ALL SELECT 'PaymentTransaction', COUNT(*) FROM `PaymentTransaction`
UNION ALL SELECT 'Wallet', COUNT(*) FROM `Wallet`
UNION ALL SELECT 'BetProduct', COUNT(*) FROM `BetProduct`
UNION ALL SELECT 'BetEvent', COUNT(*) FROM `BetEvent`
UNION ALL SELECT 'BetTicket', COUNT(*) FROM `BetTicket`
UNION ALL SELECT 'RaceResultSubmission', COUNT(*) FROM `RaceResultSubmission`
UNION ALL SELECT 'RaceResult', COUNT(*) FROM `RaceResult`
UNION ALL SELECT 'PrizeDistribution', COUNT(*) FROM `PrizeDistribution`;
