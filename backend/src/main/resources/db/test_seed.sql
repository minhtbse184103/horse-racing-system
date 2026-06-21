USE horse_racing_system;

-- Test seed for exercising the main local flows:
--(1, 'Lightweight', 450.00, 55.00, 'Lightweight tournament condition'),
(2, 'Featherweight', 550.00, 65.00, 'Featherweight tournament condition'),
(3, 'Heavyweight', 650.00, 75.00, 'Heavyweight tournament condition')
ON DUPLICATE KEY UPDATE
conditionName = VALUES(conditionName),
maxHorseWeight = VALUES(maxHorseWeight),
maxJockeyWeight = VALUES(maxJockeyWeight),
description = VALUES(description);

-- Passwords are plain text intentionally for local testing.
-- The backend upgrades them to BCrypt after the first successful login.
INSERT INTO Users
(userID, roleID, fullName, email, password, phone, status, createdAt, updatedAt)
VALUES
(1, 1, 'Admin Test', 'admin@c.com', 'admin123', '0900000001', 'ACTIVE', NOW(), NOW()),
(2, 2, 'Owner Test', 'owner@test.com', 'owner123', '0900000002', 'ACTIVE', NOW(), NOW()),
(3, 3, 'Active Jockey', 'jockey@test.com', 'jockey123', '0900000003', 'ACTIVE', NOW(), NOW()),
(4, 3, 'Jockey Under Review', 'jockey.review@test.com', 'jockey123', '0900000004', 'UNDER_REVIEW', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(5, 3, 'Rejected Jockey', 'jockey.rejected@test.com', 'jockey123', '0900000005', 'REJECTED', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
(6, 3, 'Pending Jockey', 'jockey.pending@test.com', 'jockey123', '0900000006', 'PENDING', NOW(), NOW()),
(7, 4, 'Referee Test', 'referee@test.com', 'referee123', '0900000007', 'ACTIVE', NOW(), NOW()),
(8, 5, 'Spectator Test', 'spectator@test auth, admin review, owner horse management, jockey invitations,
-- tournament/race setup, race entries, and referee assignments.

INSERT INTO Roles(roleID, roleName) VALUES
(1,'ADMIN'),
(2,'OWNER'),
(3,'JOCKEY'),
(4,'REFEREE'),
(5,'SPECTATOR')
ON DUPLICATE KEY UPDATE roleName = VALUES(roleName);

INSERT INTO TournamentCondition
(conditionID, conditionName, maxHorseWeight, maxJockeyWeight, description)
VALUES
.com', 'spectator123', '0900000008', 'ACTIVE', NOW(), NOW()),
(9, 2, 'Owner Two', 'owner2@test.com', 'owner123', '0900000009', 'ACTIVE', NOW(), NOW()),
(10, 3, 'Senior Jockey', 'jockey2@test.com', 'jockey123', '0900000010', 'ACTIVE', NOW(), NOW()),
(11, 4, 'Referee Two', 'referee2@test.com', 'referee123', '0900000011', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE
roleID = VALUES(roleID),
fullName = VALUES(fullName),
phone = VALUES(phone),
status = VALUES(status),
updatedAt = NOW();

INSERT INTO JockeyProfile
(jockeyID, licenseNo, weight, ranking, status, rejectionReason, img_url, createdAt, updatedAt)
VALUES
(3, 'JOCKEY-ACTIVE-001', 52.00, 'PROFESSIONAL', 'ACTIVE', NULL, 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
(4, 'JOCKEY-REVIEW-001', 51.00, 'INTERMEDIATE', 'UNDER_REVIEW', NULL, 'https://images.unsplash.com/photo-1517328874681-6e2d2e1f1ea8', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(5, 'JOCKEY-REJECTED-001', 53.00, 'BEGINNER', 'REJECTED', 'License proof image is unclear.', 'https://images.unsplash.com/photo-1450052590821-8bf91254a353', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
(10, 'JOCKEY-ACTIVE-002', 57.00, 'PROFESSIONAL', 'ACTIVE', NULL, 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d', DATE_SUB(NOW(), INTERVAL 15 DAY), NOW())
ON DUPLICATE KEY UPDATE
licenseNo = VALUES(licenseNo),
weight = VALUES(weight),
ranking = VALUES(ranking),
status = VALUES(status),
rejectionReason = VALUES(rejectionReason),
img_url = VALUES(img_url),
updatedAt = NOW();

INSERT INTO Horse
(horseID, ownerID, horseName, breed, gender, color, dayOfBirth, weight, healthCertExpiry, status, rejectionReason, img_url, createdAt, updatedAt)
VALUES
(101, 2, 'Lightning Bolt', 'Thoroughbred', 'MALE', 'Bay', '2020-03-12', 430.00, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ACTIVE', NULL, 'https://images.unsplash.com/photo-1553284965-fa61e9ad4795', DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),
(102, 2, 'Golden Arrow', 'Arabian', 'FEMALE', 'Chestnut', '2021-06-20', 410.00, DATE_ADD(CURDATE(), INTERVAL 10 MONTH), 'PENDING', NULL, 'https://images.unsplash.com/photo-1450052590821-8bf91254a353', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(103, 2, 'Storm Runner', 'Quarter Horse', 'MALE', 'Black', '2019-11-05', 470.00, DATE_ADD(CURDATE(), INTERVAL 8 MONTH), 'REJECTED', 'Health certificate is expired in uploaded document.', 'https://images.unsplash.com/photo-1517328874681-6e2d2e1f1ea8', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
(104, 9, 'Silver Comet', 'Thoroughbred', 'FEMALE', 'Gray', '2020-09-18', 445.00, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ACTIVE', NULL, 'https://images.unsplash.com/photo-1501706362039-c6e8096827d7', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
(105, 9, 'Crimson Wind', 'Arabian', 'MALE', 'Chestnut', '2021-02-02', 520.00, DATE_ADD(CURDATE(), INTERVAL 11 MONTH), 'ACTIVE', NULL, 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d', DATE_SUB(NOW(), INTERVAL 9 DAY), NOW())
ON DUPLICATE KEY UPDATE
ownerID = VALUES(ownerID),
breed = VALUES(breed),
gender = VALUES(gender),
color = VALUES(color),
dayOfBirth = VALUES(dayOfBirth),
weight = VALUES(weight),
healthCertExpiry = VALUES(healthCertExpiry),
status = VALUES(status),
rejectionReason = VALUES(rejectionReason),
img_url = VALUES(img_url),
updatedAt = NOW();

INSERT INTO Tournament
(tournamentID, tournamentName, location, startDate, endDate, registrationDeadline, minParticipants, maxParticipants, conditionID, status, createdBy, createdAt, updatedAt)
VALUES
(201, 'Saigon Summer Cup', 'Ho Chi Minh City', DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 32 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), 3, 8, 1, 'OpenForRegistration', 1, DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
(202, 'Hanoi Classic Draft', 'Ha Noi', DATE_ADD(CURDATE(), INTERVAL 45 DAY), DATE_ADD(CURDATE(), INTERVAL 46 DAY), DATE_ADD(NOW(), INTERVAL 35 DAY), 3, 10, 2, 'Draft', 1, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
(203, 'Da Nang Closed Cup', 'Da Nang', DATE_ADD(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 3, 6, 2, 'ClosedRegistration', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
(204, 'Can Tho Finished Derby', 'Can Tho', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY), 3, 6, 3, 'Finished', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NOW())
ON DUPLICATE KEY UPDATE
tournamentName = VALUES(tournamentName),
location = VALUES(location),
startDate = VALUES(startDate),
endDate = VALUES(endDate),
registrationDeadline = VALUES(registrationDeadline),
minParticipants = VALUES(minParticipants),
maxParticipants = VALUES(maxParticipants),
conditionID = VALUES(conditionID),
status = VALUES(status),
createdBy = VALUES(createdBy),
updatedAt = NOW();

INSERT INTO TournamentRound
(roundID, tournamentID, roundName, roundOrder, status)
VALUES
(301, 201, 'Qualified', 1, 'Draft'),
(302, 201, 'Semi-Final', 2, 'Draft'),
(303, 201, 'Final', 3, 'Draft'),
(304, 202, 'Qualified', 1, 'Draft'),
(305, 202, 'Semi-Final', 2, 'Draft'),
(306, 202, 'Final', 3, 'Draft'),
(307, 203, 'Qualified', 1, 'Draft'),
(308, 203, 'Semi-Final', 2, 'Draft'),
(309, 203, 'Final', 3, 'Draft'),
(310, 204, 'Qualified', 1, 'Finished'),
(311, 204, 'Semi-Final', 2, 'Finished'),
(312, 204, 'Final', 3, 'Finished')
ON DUPLICATE KEY UPDATE
tournamentID = VALUES(tournamentID),
roundName = VALUES(roundName),
roundOrder = VALUES(roundOrder),
status = VALUES(status);

INSERT INTO Race
(raceID, roundID, raceName, startTime, endTime, raceOrder, distance, status)
VALUES
(401, 301, 'Qualified Heat 1', DATE_ADD(NOW(), INTERVAL 31 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 31 DAY), INTERVAL 20 MINUTE), 1, 1200, 'Draft'),
(402, 301, 'Qualified Heat 2', DATE_ADD(DATE_ADD(NOW(), INTERVAL 31 DAY), INTERVAL 1 HOUR), DATE_ADD(DATE_ADD(NOW(), INTERVAL 31 DAY), INTERVAL 80 MINUTE), 2, 1200, 'Draft'),
(403, 302, 'Semi-Final Heat 1', DATE_ADD(NOW(), INTERVAL 32 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 32 DAY), INTERVAL 20 MINUTE), 1, 1600, 'Draft'),
(404, 303, 'Final Race', DATE_ADD(DATE_ADD(NOW(), INTERVAL 32 DAY), INTERVAL 3 HOUR), DATE_ADD(DATE_ADD(NOW(), INTERVAL 32 DAY), INTERVAL 200 MINUTE), 1, 2000, 'Draft'),
(405, 307, 'Closed Qualified Heat 1', DATE_ADD(NOW(), INTERVAL 15 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 15 DAY), INTERVAL 20 MINUTE), 1, 1400, 'Draft'),
(406, 310, 'Finished Qualified Heat 1', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 20 DAY), INTERVAL 20 MINUTE), 1, 1400, 'Finished')
ON DUPLICATE KEY UPDATE
roundID = VALUES(roundID),
raceName = VALUES(raceName),
startTime = VALUES(startTime),
endTime = VALUES(endTime),
raceOrder = VALUES(raceOrder),
distance = VALUES(distance),
status = VALUES(status);

INSERT INTO Registration
(registrationID, tournamentID, horseID, ownerID, jockeyID, status, createdAt, updatedAt)
VALUES
(501, 201, 101, 2, 3, 'CONFIRMED', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
(502, 201, 104, 9, 10, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
(503, 201, 105, 9, NULL, 'PENDING', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(504, 203, 104, 9, 3, 'CONFIRMED', DATE_SUB(NOW(), INTERVAL 18 DAY), NOW()),
(505, 204, 101, 2, 3, 'CONFIRMED', DATE_SUB(NOW(), INTERVAL 45 DAY), NOW())
ON DUPLICATE KEY UPDATE
tournamentID = VALUES(tournamentID),
horseID = VALUES(horseID),
ownerID = VALUES(ownerID),
jockeyID = VALUES(jockeyID),
status = VALUES(status),
updatedAt = NOW();

INSERT INTO JockeyInvitation
(invitationID, registrationID, tournamentID, horseID, ownerID, jockeyID, status, message, createdAt, expiredAt, respondedAt)
VALUES
(601, 501, 201, 101, 2, 3, 'ACCEPTED', 'Please join Lightning Bolt for Saigon Summer Cup.', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(602, 502, 201, 104, 9, 10, 'ACCEPTED', 'Please join Silver Comet for Saigon Summer Cup.', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(603, 503, 201, 105, 9, 3, 'PENDING', 'Can you ride Crimson Wind?', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 6 DAY), NULL)
ON DUPLICATE KEY UPDATE
registrationID = VALUES(registrationID),
tournamentID = VALUES(tournamentID),
horseID = VALUES(horseID),
ownerID = VALUES(ownerID),
jockeyID = VALUES(jockeyID),
status = VALUES(status),
message = VALUES(message),
expiredAt = VALUES(expiredAt),
respondedAt = VALUES(respondedAt);

INSERT INTO RaceEntry
(raceEntryID, raceID, registrationID, laneNumber, status)
VALUES
(701, 401, 501, 1, 'ASSIGNED'),
(702, 405, 504, 1, 'ASSIGNED'),
(703, 406, 505, 1, 'FINISHED')
ON DUPLICATE KEY UPDATE
raceID = VALUES(raceID),
registrationID = VALUES(registrationID),
laneNumber = VALUES(laneNumber),
status = VALUES(status);

INSERT INTO RefereeAssignment
(assignmentID, raceID, refereeUserID, assignedAt, status)
VALUES
(801, 401, 7, NOW(), 'Assigned'),
(802, 402, 11, NOW(), 'Assigned'),
(803, 405, 7, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Assigned')
ON DUPLICATE KEY UPDATE
raceID = VALUES(raceID),
refereeUserID = VALUES(refereeUserID),
assignedAt = VALUES(assignedAt),
status = VALUES(status);
