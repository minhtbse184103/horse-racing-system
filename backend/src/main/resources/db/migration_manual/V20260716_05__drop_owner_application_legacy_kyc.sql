USE `horse_racing_system`;

-- Owner approval and Didit KYC are independent flows. Hibernate cannot remove
-- this legacy NOT NULL column, so new Owner applications fail unless it is
-- dropped manually. Resolve the foreign key by column instead of assuming a
-- generated constraint name, which differs between databases.
DROP PROCEDURE IF EXISTS `drop_owner_application_legacy_kyc`;

DELIMITER $$
CREATE PROCEDURE `drop_owner_application_legacy_kyc`()
BEGIN
  DECLARE legacy_fk_name varchar(64) DEFAULT NULL;

  SELECT CONSTRAINT_NAME
    INTO legacy_fk_name
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND LOWER(TABLE_NAME) = LOWER('OwnerApplication')
    AND LOWER(COLUMN_NAME) = LOWER('kycVerificationID')
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1;

  IF legacy_fk_name IS NOT NULL THEN
    SET @drop_owner_kyc_fk_sql = CONCAT(
      'ALTER TABLE `OwnerApplication` DROP FOREIGN KEY `',
      REPLACE(legacy_fk_name, '`', '``'),
      '`'
    );
    PREPARE drop_owner_kyc_fk_statement FROM @drop_owner_kyc_fk_sql;
    EXECUTE drop_owner_kyc_fk_statement;
    DEALLOCATE PREPARE drop_owner_kyc_fk_statement;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND LOWER(TABLE_NAME) = LOWER('OwnerApplication')
      AND LOWER(COLUMN_NAME) = LOWER('kycVerificationID')
  ) THEN
    ALTER TABLE `OwnerApplication` DROP COLUMN `kycVerificationID`;
  END IF;
END$$
DELIMITER ;

CALL `drop_owner_application_legacy_kyc`();
DROP PROCEDURE `drop_owner_application_legacy_kyc`;
