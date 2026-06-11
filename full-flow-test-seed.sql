USE horse_racing_system;

-- FULL SYSTEM TEST SEED
-- Run this after Main Database (1).md has created the schema.
-- WARNING: This clears all existing data in horse_racing_system.
--
-- Passwords are intentionally plain text for local testing.
-- The backend upgrades a plain-text password to BCrypt after a successful login.

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
TRUNCATE TABLE Users;
TRUNCATE TABLE Roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- FIXED REFERENCE DATA
-- ---------------------------------------------------------------------------

INSERT INTO Roles (roleID, roleName) VALUES
    (1, 'ADMIN'),
    (2, 'OWNER'),
    (3, 'JOCKEY'),
    (4, 'REFEREE'),
    (5, 'SPECTATOR');

INSERT INTO TournamentCondition
    (conditionID, conditionName, maxHorseWeight, maxJockeyWeight, description)
VALUES
    (1, 'Lightweight', 450.00, 55.00, 'Lightweight tournament condition'),
    (2, 'Featherweight', 550.00, 65.00, 'Featherweight tournament condition'),
    (3, 'Heavyweight', 650.00, 75.00, 'Heavyweight tournament condition');

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------

INSERT INTO Users
    (userID, roleID, fullName, email, password, phone, status,
     rejectionReason, createdAt, updatedAt)
VALUES
    (1, 1, 'Admin FE Test', 'admin@c.com', 'admin123', '0900000001',
     'ACTIVE', NULL, NOW(), NOW()),
    (2, 2, 'Owner Alpha', 'owner@test.com', 'owner123', '0900000002',
     'ACTIVE', NULL, NOW(), NOW()),
    (3, 2, 'Owner Beta', 'owner2@test.com', 'owner123', '0900000003',
     'ACTIVE', NULL, NOW(), NOW()),
    (4, 3, 'Active Jockey One', 'jockey@test.com', 'jockey123', '0900000004',
     'ACTIVE', NULL, NOW(), NOW()),
    (5, 3, 'Active Jockey Two', 'jockey2@test.com', 'jockey123', '0900000005',
     'ACTIVE', NULL, NOW(), NOW()),
    (6, 3, 'Jockey Awaiting Review', 'jockey.review@test.com', 'jockey123', '0900000006',
     'UNDER_REVIEW', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
    (7, 3, 'Rejected Jockey', 'jockey.rejected@test.com', 'jockey123', '0900000007',
     'REJECTED', 'License proof image is unclear.', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (8, 3, 'Jockey Without Profile', 'jockey.pending@test.com', 'jockey123', '0900000008',
     'PENDING', NULL, NOW(), NOW()),
    (9, 4, 'Referee Test', 'referee@test.com', 'referee123', '0900000009',
     'ACTIVE', NULL, NOW(), NOW()),
    (10, 5, 'Spectator Test', 'spectator@test.com', 'spectator123', '0900000010',
     'ACTIVE', NULL, NOW(), NOW());

-- ---------------------------------------------------------------------------
-- JOCKEY PROFILE REVIEW DATA
-- ---------------------------------------------------------------------------

INSERT INTO JockeyProfile
    (jockeyID, licenseNo, weight, ranking, status, img_url, createdAt, updatedAt)
VALUES
    (4, 'JOCKEY-ACTIVE-001', 52.00, 'PROFESSIONAL', 'ACTIVE',
     'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a',
     DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (5, 'JOCKEY-ACTIVE-002', 54.00, 'ELITE', 'ACTIVE',
     'https://images.unsplash.com/photo-1542296332-2e4473faf563',
     DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (6, 'JOCKEY-REVIEW-001', 51.00, 'INTERMEDIATE', 'UNDER_REVIEW',
     'https://images.unsplash.com/photo-1517328874681-6e2d2e1f1ea8',
     DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
    (7, 'JOCKEY-REJECTED-001', 53.00, 'BEGINNER', 'REJECTED',
     'https://images.unsplash.com/photo-1450052590821-8bf91254a353',
     DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ---------------------------------------------------------------------------
-- HORSE REVIEW AND REGISTRATION DATA
-- ---------------------------------------------------------------------------

INSERT INTO Horse
    (horseID, ownerID, horseName, breed, gender, color, dayOfBirth, weight,
     healthCertExpiry, status, rejectionReason, img_url, createdAt, updatedAt)
VALUES
    -- Admin Horse Review: approve this valid pending horse.
    (1, 2, 'Pending Approval Runner', 'Thoroughbred', 'MALE', 'Bay',
     '2021-04-10', 420.00, '2027-12-31', 'PENDING', NULL,
     'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a',
     DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),

    -- Admin Horse Review: reject this pending horse with feedback.
    (2, 2, 'Pending Rejection Runner', 'Thoroughbred', 'FEMALE', 'Chestnut',
     '2020-07-15', 425.00, '2027-12-31', 'PENDING', NULL,
     'https://images.unsplash.com/photo-1598974357801-cbca100e65d3',
     DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 HOUR)),

    -- Owner can edit this rejected horse and resubmit it as PENDING.
    (3, 2, 'Rejected Horse Runner', 'Arabian', 'MALE', 'Black',
     '2021-01-20', 410.00, '2027-12-31', 'REJECTED',
     'Health certificate proof is unreadable.',
     'https://images.unsplash.com/photo-1517328874681-6e2d2e1f1ea8',
     DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),

    -- Active horses used by registration and race-entry flows.
    (4, 2, 'Registration Confirm Runner', 'Thoroughbred', 'MALE', 'Gray',
     '2020-09-08', 415.00, '2027-12-31', 'ACTIVE', NULL,
     'https://images.unsplash.com/photo-1450052590821-8bf91254a353',
     DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (5, 2, 'Registration Reject Runner', 'Thoroughbred', 'FEMALE', 'Bay',
     '2021-03-12', 418.00, '2027-12-31', 'ACTIVE', NULL,
     'https://images.unsplash.com/photo-1551884831-bbf3cdc6469e',
     DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (6, 3, 'Race Entry Available Runner', 'Thoroughbred', 'MALE', 'Chestnut',
     '2020-05-25', 430.00, '2027-12-31', 'ACTIVE', NULL,
     'https://images.unsplash.com/photo-1566251037378-5e04e3bec343',
     DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (7, 3, 'Race Entry Assigned Runner', 'Thoroughbred', 'FEMALE', 'Black',
     '2021-06-18', 422.00, '2027-12-31', 'ACTIVE', NULL,
     'https://images.unsplash.com/photo-1534773728080-33d31da27ae5',
     DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (8, 2, 'Registration History Runner', 'Arabian', 'MALE', 'White',
     '2020-11-11', 405.00, '2027-12-31', 'ACTIVE', NULL,
     'https://images.unsplash.com/photo-1534567110243-8875d64ca8ff',
     DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY));

-- ---------------------------------------------------------------------------
-- TOURNAMENT LIFECYCLE DATA
-- ---------------------------------------------------------------------------

INSERT INTO Tournament
    (tournamentID, tournamentName, location, startDate, endDate,
     registrationDeadline, minParticipants, maxParticipants, conditionID,
     status, createdBy, createdAt, updatedAt)
VALUES
    (1, 'Draft Event Creation Test', 'Phuket Test Track',
     '2027-01-10', '2027-01-12', '2027-01-01 23:59:59',
     2, 16, 2, 'Draft', 1, NOW(), NOW()),
    (2, 'Open Registration Test', 'Bangkok Test Track',
     '2026-11-10', '2026-11-12', '2026-11-01 23:59:59',
     2, 12, 1, 'OpenForRegistration', 1, NOW(), NOW()),
    (3, 'Race Entry Assignment Test', 'Chiang Mai Test Track',
     '2026-12-10', '2026-12-12', '2026-12-01 23:59:59',
     2, 12, 1, 'ClosedRegistration', 1, NOW(), NOW()),
    (4, 'Ongoing Tournament Test', 'Pattaya Test Track',
     '2026-08-10', '2026-08-12', '2026-08-01 23:59:59',
     2, 12, 2, 'Ongoing', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
    (5, 'Finished Tournament History', 'Hua Hin Test Track',
     '2026-04-10', '2026-04-12', '2026-04-01 23:59:59',
     2, 12, 3, 'Finished', 1, DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY)),
    (6, 'Cancelled Tournament History', 'Ayutthaya Test Track',
     '2026-09-10', '2026-09-12', '2026-09-01 23:59:59',
     2, 12, 1, 'Cancelled', 1, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY));

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
    (9, 3, 'Final', 3, 'Draft'),
    (10, 4, 'Qualified', 1, 'Ongoing'),
    (11, 4, 'Semi-Final', 2, 'Draft'),
    (12, 4, 'Final', 3, 'Draft'),
    (13, 5, 'Qualified', 1, 'Finished'),
    (14, 5, 'Semi-Final', 2, 'Finished'),
    (15, 5, 'Final', 3, 'Finished');

INSERT INTO Race
    (raceID, roundID, raceName, startTime, endTime, raceOrder, distance, status)
VALUES
    (1, 1, 'Qualified 1', '2027-01-10 09:00:00', '2027-01-10 09:10:00',
     1, 1200, 'Draft'),
    (2, 7, 'Qualified 1', '2026-12-10 09:00:00', '2026-12-10 09:10:00',
     1, 1200, 'Draft'),
    (3, 7, 'Qualified 2', '2026-12-10 10:00:00', '2026-12-10 10:10:00',
     2, 1200, 'Draft'),
    (4, 10, 'Qualified 1', '2026-08-10 09:00:00', NULL,
     1, 1400, 'Ongoing'),
    (5, 15, 'Final 1', '2026-04-12 15:00:00', '2026-04-12 15:12:00',
     1, 1600, 'Finished');

-- ---------------------------------------------------------------------------
-- REGISTRATION REVIEW AND RACE ENTRY DATA
-- ---------------------------------------------------------------------------

INSERT INTO Registration
    (registrationID, tournamentID, horseID, ownerID, jockeyID, status,
     createdAt, updatedAt)
VALUES
    -- Admin Registration Review: confirm this one.
    (1, 2, 4, 2, 4, 'ACCEPTED',
     DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),

    -- Admin Registration Review: reject this one.
    (2, 2, 5, 2, 5, 'ACCEPTED',
     DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),

    -- Registration history.
    (3, 2, 8, 2, 4, 'REJECTED',
     DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),

    -- Confirmed and available for RaceEntry assignment.
    (4, 3, 6, 3, 4, 'CONFIRMED',
     DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),

    -- Confirmed and already assigned to Race 2.
    (5, 3, 7, 3, 5, 'CONFIRMED',
     DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY));

INSERT INTO JockeyInvitation
    (invitationID, registrationID, tournamentID, horseID, ownerID, jockeyID,
     status, message, createdAt, expiredAt, respondedAt)
VALUES
    (1, 1, 2, 4, 2, 4, 'ACCEPTED',
     'Accepted invitation awaiting admin confirmation.',
     DATE_SUB(NOW(), INTERVAL 8 HOUR), DATE_ADD(NOW(), INTERVAL 7 DAY),
     DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    (2, 2, 2, 5, 2, 5, 'ACCEPTED',
     'Accepted invitation available for admin rejection testing.',
     DATE_SUB(NOW(), INTERVAL 7 HOUR), DATE_ADD(NOW(), INTERVAL 7 DAY),
     DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (3, 3, 2, 8, 2, 4, 'ACCEPTED',
     'Historical rejected registration.',
     DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY),
     DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (4, 4, 3, 6, 3, 4, 'ACCEPTED',
     'Confirmed registration available for race-entry assignment.',
     DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY),
     DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (5, 5, 3, 7, 3, 5, 'ACCEPTED',
     'Confirmed registration already assigned to a race.',
     DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY),
     DATE_SUB(NOW(), INTERVAL 8 DAY));

INSERT INTO RaceEntry
    (raceEntryID, raceID, registrationID, laneNumber, status)
VALUES
    (1, 2, 5, 1, 'ASSIGNED');

INSERT INTO RefereeAssignment
    (assignmentID, raceID, refereeUserID, assignedAt, status)
VALUES
    (1, 4, 9, DATE_SUB(NOW(), INTERVAL 1 DAY), 'ACTIVE'),
    (2, 5, 9, DATE_SUB(NOW(), INTERVAL 70 DAY), 'COMPLETED');

-- ---------------------------------------------------------------------------
-- TEST GUIDE
-- ---------------------------------------------------------------------------

-- Accounts:
-- ADMIN          admin@c.com                 / admin123
-- OWNER          owner@test.com              / owner123
-- OWNER          owner2@test.com             / owner123
-- ACTIVE JOCKEY  jockey@test.com             / jockey123
-- ACTIVE JOCKEY  jockey2@test.com            / jockey123
-- REVIEW JOCKEY  jockey.review@test.com      / jockey123
-- REJECTED       jockey.rejected@test.com    / jockey123
-- PENDING        jockey.pending@test.com     / jockey123
-- REFEREE        referee@test.com             / referee123
-- SPECTATOR      spectator@test.com           / spectator123
--
-- Admin Jockey Review:
-- GET /api/admin/jockey-profiles/under-review returns jockeyID 6.
-- PUT /api/admin/jockey-profiles/6/approve approves it.
-- PUT /api/admin/jockey-profiles/6/reject with {"feedback":"Reason"} rejects it.
--
-- Admin Horse Review:
-- GET /api/admin/horses/pending returns horseID 1 and 2.
-- PUT /api/admin/horses/1/approve approves the valid horse.
-- PUT /api/admin/horses/2/reject with {"feedback":"Reason"} rejects it.
--
-- Registration Review:
-- registrationID 1 and 2 are ACCEPTED.
-- registrationID 3 is REJECTED history.
--
-- Race Entry:
-- registrationID 4 can be assigned to raceID 2 or 3.
-- raceEntryID 1 is already assigned to raceID 2, lane 1.

SELECT userID, fullName, email, status, rejectionReason
FROM Users
ORDER BY userID;

SELECT jockeyID, licenseNo, ranking, status
FROM JockeyProfile
ORDER BY jockeyID;

SELECT horseID, horseName, ownerID, status, rejectionReason
FROM Horse
ORDER BY horseID;

SELECT tournamentID, tournamentName, status
FROM Tournament
ORDER BY tournamentID;

SELECT registrationID, tournamentID, horseID, jockeyID, status
FROM Registration
ORDER BY registrationID;

SELECT raceEntryID, raceID, registrationID, laneNumber, status
FROM RaceEntry
ORDER BY raceEntryID;
