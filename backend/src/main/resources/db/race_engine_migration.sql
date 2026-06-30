USE horse_racing_system;

-- WARNING:
-- This is a legacy migration for databases created before the current
-- team_schema.sql. Do not run this file after importing the current
-- team_schema.sql, because these columns already exist there.

ALTER TABLE `Race`
  ADD COLUMN `runTriggeredBy` INT NULL AFTER `status`,
  ADD COLUMN `runStartedAt` DATETIME NULL AFTER `runTriggeredBy`,
  ADD COLUMN `raceEngineToken` VARCHAR(128) NULL AFTER `runStartedAt`,
  ADD COLUMN `raceEngineTokenIssuedAt` DATETIME NULL AFTER `raceEngineToken`;

ALTER TABLE `Race`
  ADD CONSTRAINT `Race_runTriggeredBy_fk`
    FOREIGN KEY (`runTriggeredBy`) REFERENCES `Users` (`userID`);
