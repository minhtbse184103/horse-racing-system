USE horse_racing_system;

-- This script permanently clears all domain data.
-- It preserves only Roles and Users, then creates fresh API test data.

SET @admin_id = (
    SELECT u.userID
    FROM Users u
    JOIN Roles r ON r.roleID = u.roleID
    WHERE UPPER(r.roleName) = 'ADMIN'
      AND UPPER(u.status) = 'ACTIVE'
    ORDER BY u.userID
    LIMIT 1
);

SET @owner_id = (
    SELECT u.userID
    FROM Users u
    JOIN Roles r ON r.roleID = u.roleID
    WHERE UPPER(r.roleName) = 'OWNER'
      AND UPPER(u.status) = 'ACTIVE'
    ORDER BY u.userID
    LIMIT 1
);

SET @jockey_id = (
    SELECT u.userID
    FROM Users u
    JOIN Roles r ON r.roleID = u.roleID
    WHERE UPPER(r.roleName) = 'JOCKEY'
      AND UPPER(u.status) = 'ACTIVE'
    ORDER BY u.userID
    LIMIT 1
);

DROP PROCEDURE IF EXISTS assert_seed_users_exist;

DELIMITER $$
CREATE PROCEDURE assert_seed_users_exist()
BEGIN
    IF @admin_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Seed stopped: an ACTIVE ADMIN user is required.';
    END IF;
    IF @owner_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Seed stopped: an ACTIVE OWNER user is required.';
    END IF;
    IF @jockey_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Seed stopped: an ACTIVE JOCKEY user is required.';
    END IF;
END$$
DELIMITER ;

CALL assert_seed_users_exist();
DROP PROCEDURE assert_seed_users_exist;

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
    (jockeyID, licenseNo, weight, ranking, status, createdAt, updatedAt)
VALUES
    (@jockey_id, CONCAT('TEST-LICENSE-', @jockey_id), 52.00, 'TEST', 'ACTIVE', NOW(), NOW());

INSERT INTO Horse
    (horseID, ownerID, horseName, breed, gender, color, dayOfBirth, weight,
     healthCertExpiry, status, createdAt, updatedAt)
VALUES
    (1, @owner_id, 'Review Runner', 'Thoroughbred', 'MALE', 'Bay',
     '2021-04-10', 420.00, '2027-12-31', 'ACTIVE', NOW(), NOW()),
    (2, @owner_id, 'Rejected Runner', 'Thoroughbred', 'FEMALE', 'Chestnut',
     '2020-07-15', 425.00, '2027-12-31', 'ACTIVE', NOW(), NOW()),
    (3, @owner_id, 'Race Entry Runner', 'Thoroughbred', 'MALE', 'Black',
     '2021-01-20', 430.00, '2027-12-31', 'ACTIVE', NOW(), NOW());

INSERT INTO Tournament
    (tournamentID, tournamentName, location, startDate, endDate,
     registrationDeadline, minParticipants, maxParticipants, conditionID,
     status, createdBy, createdAt, updatedAt)
VALUES
    (1, 'Admin Registration Review Test', 'Test Track A',
     '2026-11-10', '2026-11-12', '2026-11-01 23:59:59',
     1, 12, 1, 'OpenForRegistration', @admin_id, NOW(), NOW()),
    (2, 'Race Entry Assignment Test', 'Test Track B',
     '2026-12-10', '2026-12-12', '2026-12-01 23:59:59',
     1, 12, 1, 'ClosedRegistration', @admin_id, NOW(), NOW());

INSERT INTO TournamentRound
    (roundID, tournamentID, roundName, roundOrder, status)
VALUES
    (1, 1, 'Qualified', 1, 'Draft'),
    (2, 1, 'Semi-Final', 2, 'Draft'),
    (3, 1, 'Final', 3, 'Draft'),
    (4, 2, 'Qualified', 1, 'Draft'),
    (5, 2, 'Semi-Final', 2, 'Draft'),
    (6, 2, 'Final', 3, 'Draft');

INSERT INTO Race
    (raceID, roundID, raceName, startTime, endTime, raceOrder, distance, status)
VALUES
    (1, 4, 'Qualified 1', '2026-12-10 09:00:00', '2026-12-10 09:10:00',
     1, 1200, 'Draft'),
    (2, 4, 'Qualified 2', '2026-12-10 10:00:00', '2026-12-10 10:10:00',
     2, 1200, 'Draft');

INSERT INTO Registration
    (registrationID, tournamentID, horseID, ownerID, jockeyID, status, createdAt, updatedAt)
VALUES
    (1, 1, 1, @owner_id, @jockey_id, 'ACCEPTED', NOW(), NOW()),
    (2, 1, 2, @owner_id, @jockey_id, 'REJECTED', NOW(), NOW()),
    (3, 2, 3, @owner_id, @jockey_id, 'CONFIRMED', NOW(), NOW());

INSERT INTO JockeyInvitation
    (invitationID, registrationID, ownerID, jockeyID, status, message,
     createdAt, expiredAt, respondedAt)
VALUES
    (1, 1, @owner_id, @jockey_id, 'ACCEPTED', 'Accepted invitation for admin review test',
     NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), NOW()),
    (2, 2, @owner_id, @jockey_id, 'ACCEPTED', 'Historical rejected registration test',
     NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), NOW()),
    (3, 3, @owner_id, @jockey_id, 'ACCEPTED', 'Confirmed registration for race entry test',
     NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), NOW());

-- Useful IDs for Swagger:
-- Registration 1: ACCEPTED, can be confirmed or rejected by admin.
-- Registration 2: REJECTED, visible in registration history.
-- Registration 3: CONFIRMED, can be assigned to Race 1 or Race 2.
-- Race 1 and Race 2 belong to the same Qualified round.

SELECT @admin_id AS adminUserID, @owner_id AS ownerUserID, @jockey_id AS jockeyUserID;
SELECT * FROM Tournament ORDER BY tournamentID;
SELECT * FROM Registration ORDER BY registrationID;
SELECT * FROM Race ORDER BY raceID;
