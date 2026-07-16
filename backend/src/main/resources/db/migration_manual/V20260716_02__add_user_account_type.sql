USE `horse_racing_system`;

ALTER TABLE `Users`
  ADD COLUMN IF NOT EXISTS `accountType` varchar(50) NOT NULL DEFAULT 'SPECTATOR' AFTER `roleID`;

UPDATE `Users` u
JOIN `Roles` r ON r.`roleID` = u.`roleID`
SET u.`accountType` = r.`roleName`;

UPDATE `Users` u
JOIN `OwnerApplication` oa ON oa.`userID` = u.`userID`
SET u.`accountType` = 'OWNER';

UPDATE `Users` u
JOIN `JockeyVerification` jv ON jv.`jockeyID` = u.`userID`
SET u.`accountType` = 'JOCKEY';

SET @account_type_constraint_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Users'
    AND CONSTRAINT_NAME = 'chk_users_account_type'
);

SET @add_account_type_constraint_sql = IF(
  @account_type_constraint_exists = 0,
  'ALTER TABLE `Users` ADD CONSTRAINT `chk_users_account_type` CHECK (`accountType` IN (''ADMIN'', ''OWNER'', ''JOCKEY'', ''REFEREE'', ''SPECTATOR''))',
  'SELECT 1'
);
PREPARE add_account_type_constraint_stmt FROM @add_account_type_constraint_sql;
EXECUTE add_account_type_constraint_stmt;
DEALLOCATE PREPARE add_account_type_constraint_stmt;
