USE horse_racing_system;

-- ADMIN FE TEST SEED
-- Compatible with the newest schema containing:
-- Users.rejectionReason, Horse.img_url, and JockeyProfile.img_url.
--
-- This script:
-- 1. Preserves Roles and unrelated Users.
-- 2. Creates or resets three known test accounts.
-- 3. Deletes all existing domain/event data.
-- 4. Seeds Event Creation, Registration Review, and RaceEntry test scenarios.

INSERT INTO Users
    (roleID, fullName, email, password, phone, status, rejectionReason, createdAt, updatedAt)
VALUES
    ((SELECT roleID FROM Roles WHERE roleName = 'ADMIN'),
     'Admin FE Test', 'admin@c.com', 'admin123', '0900000001',
     'ACTIVE', NULL, NOW(), NOW()),
    ((SELECT roleID FROM Roles WHERE roleName = 'OWNER'),
     'Owner FE Test', 'owner@test.com', 'owner123', '0900000002',
     'ACTIVE', NULL, NOW(), NOW()),
    ((SELECT roleID FROM Roles WHERE roleName = 'JOCKEY'),
     'Jockey FE Test', 'jockey@test.com', 'jockey123', '0900000003',
     'ACTIVE', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    roleID = VALUES(roleID),
    fullName = VALUES(fullName),
    password = VALUES(password),
    phone = VALUES(phone),
    status = 'ACTIVE',
    rejectionReason = NULL,
    updatedAt = NOW();

SET @admin_id = (SELECT userID FROM Users WHERE email = 'admin@c.com');
SET @owner_id = (SELECT userID FROM Users WHERE email = 'owner@test.com');
SET @jockey_id = (SELECT userID FROM Users WHERE email = 'jockey@test.com');

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE RefereeAssignment;
TRUNCATE TABLE RaceEntry;
TRUNCATE TABLE JockeyInvitation;
TRUNCATE TABLE Registration;
TRUNCATE TABLE Race;
TRUNCATE TABLE TournamentRound;
TRUNCATE TABLE Horse;
TRUNCATE TABLE JockeyProfile;
TRUNCATE TABLE Tournament;
TRUNCATE TABLE TournamentCondition;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO TournamentCondition
    (conditionID, conditionName, maxHorseWeight, maxJockeyWeight, description)
VALUES
    (1, 'Lightweight', 450.00, 55.00, 'Lightweight tournament condition'),
    (2, 'Featherweight', 550.00, 65.00, 'Featherweight tournament condition'),
    (3, 'Heavyweight', 650.00, 75.00, 'Heavyweight tournament condition');

INSERT INTO JockeyProfile
    (jockeyID, licenseNo, weight, ranking, status, img_url, createdAt, updatedAt)
VALUES
    (@jockey_id, 'FE-TEST-JOCKEY-001', 52.00, 'Test Ranking', 'ACTIVE',
     'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a',
     NOW(), NOW());

INSERT INTO Horse
    (horseID, ownerID, horseName, breed, gender, color, dayOfBirth, weight,
     healthCertExpiry, status, img_url, createdAt, updatedAt)
VALUES
    (1, @owner_id, 'Pending Confirm Runner', 'Thoroughbred', 'MALE', 'Bay',
     '2021-04-10', 420.00, '2027-12-31', 'ACTIVE',
     'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a', NOW(), NOW()),
    (2, @owner_id, 'Pending Reject Runner', 'Thoroughbred', 'FEMALE', 'Chestnut',
     '2020-07-15', 425.00, '2027-12-31', 'ACTIVE',
     'https://images.unsplash.com/photo-1598974357801-cbca100e65d3', NOW(), NOW()),
    (3, @owner_id, 'History Rejected Runner', 'Thoroughbred', 'MALE', 'Black',
     '2021-01-20', 430.00, '2027-12-31', 'ACTIVE',
     'https://images.unsplash.com/photo-1517328874681-6e2d2e1f1ea8', NOW(), NOW()),
    (4, @owner_id, 'Race Entry Runner', 'Thoroughbred', 'FEMALE', 'Gray',
     '2020-09-08', 415.00, '2027-12-31', 'ACTIVE',
     'https://images.unsplash.com/photo-1450052590821-8bf91254a353', NOW(), NOW());

INSERT INTO Tournament
    (tournamentID, tournamentName, location, startDate, endDate,
     registrationDeadline, minParticipants, maxParticipants, conditionID,
     status, createdBy, createdAt, updatedAt)
VALUES
    (1, 'Registration Review Test', 'Bangkok Test Track',
     '2026-11-10', '2026-11-12', '2026-11-01 23:59:59',
     1, 12, 1, 'OpenForRegistration', @admin_id, NOW(), NOW()),
    (2, 'Race Entry Assignment Test', 'Chiang Mai Test Track',
     '2026-12-10', '2026-12-12', '2026-12-01 23:59:59',
     1, 12, 1, 'ClosedRegistration', @admin_id, NOW(), NOW()),
    (3, 'Draft Event Creation Test', 'Phuket Test Track',
     '2027-01-10', '2027-01-12', '2027-01-01 23:59:59',
     2, 16, 2, 'Draft', @admin_id, NOW(), NOW());

INSERT INTO TournamentRound
    (roundID, tournamentID, roundName, roundOrder, status)
VALUES
    (1, 1, 'Qualified', 1, 'Draft'),
    (2, 1, 'Semi-Final', 2, 'Draft'),
    (3, 1, 'Final', 3, 'Draft'),
    (4, 2, 'Qualified', 1, 'Draft'),
    (5, 2, 'Semi-Final', 2, 'Draft'),
    (6, 2, 'Final', 3, 'Draft'),
    (7, 3, 'Qualified', 1, 'Draft'),
    (8, 3, 'Semi-Final', 2, 'Draft'),
    (9, 3, 'Final', 3, 'Draft');

INSERT INTO Race
    (raceID, roundID, raceName, startTime, endTime, raceOrder, distance, status)
VALUES
    (1, 4, 'Qualified 1', '2026-12-10 09:00:00', '2026-12-10 09:10:00',
     1, 1200, 'Draft'),
    (2, 4, 'Qualified 2', '2026-12-10 10:00:00', '2026-12-10 10:10:00',
     2, 1200, 'Draft'),
    (3, 7, 'Qualified 1', '2027-01-10 09:00:00', '2027-01-10 09:12:00',
     1, 1400, 'Draft');

INSERT INTO Registration
    (registrationID, tournamentID, horseID, ownerID, jockeyID, status, createdAt, updatedAt)
VALUES
    (1, 1, 1, @owner_id, @jockey_id, 'ACCEPTED',
     DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    (2, 1, 2, @owner_id, @jockey_id, 'ACCEPTED',
     DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (3, 1, 3, @owner_id, @jockey_id, 'REJECTED',
     DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 2, 4, @owner_id, @jockey_id, 'CONFIRMED',
     DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO JockeyInvitation
    (invitationID, registrationID, ownerID, jockeyID, status, message,
     createdAt, expiredAt, respondedAt)
VALUES
    (1, 1, @owner_id, @jockey_id, 'ACCEPTED',
     'Accepted invitation for admin confirmation test',
     DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_ADD(NOW(), INTERVAL 7 DAY),
     DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    (2, 2, @owner_id, @jockey_id, 'ACCEPTED',
     'Accepted invitation for admin rejection test',
     DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_ADD(NOW(), INTERVAL 7 DAY),
     DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (3, 3, @owner_id, @jockey_id, 'ACCEPTED',
     'Historical rejected registration',
     DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
     DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (4, 4, @owner_id, @jockey_id, 'ACCEPTED',
     'Confirmed registration ready for RaceEntry assignment',
     DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY),
     DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Test accounts:
-- ADMIN  : admin@c.com / admin123
-- OWNER  : owner@test.com / owner123
-- JOCKEY : jockey@test.com / jockey123
--
-- Registration Review:
-- Registration 1: ACCEPTED, confirm this one.
-- Registration 2: ACCEPTED, reject this one.
-- Registration 3: REJECTED, already visible in history.
--
-- RaceEntry:
-- Registration 4: CONFIRMED and belongs to Tournament 2.
-- Assign it to Race 1 or Race 2.
--
-- Event Creation:
-- Tournament 3: Draft tournament available for update/open/cancel tests.

SELECT userID, fullName, email, status
FROM Users
WHERE email IN ('admin@c.com', 'owner@test.com', 'jockey@test.com')
ORDER BY userID;

SELECT registrationID, tournamentID, horseID, jockeyID, status
FROM Registration
ORDER BY registrationID;

SELECT raceID, roundID, raceName, status
FROM Race
ORDER BY raceID;
