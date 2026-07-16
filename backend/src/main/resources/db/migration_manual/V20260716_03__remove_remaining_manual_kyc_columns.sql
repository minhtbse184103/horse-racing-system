USE `horse_racing_system`;

-- Hibernate ddl-auto=update can add the Didit columns, but it never removes the
-- legacy manual-KYC columns. Any remaining NOT NULL column makes a new Didit
-- session fail because the application no longer supplies manual identity data.
-- Use information_schema because older MySQL 8 releases do not support
-- ALTER TABLE ... DROP COLUMN IF EXISTS.
DROP PROCEDURE IF EXISTS `drop_legacy_kyc_column`;

DELIMITER $$
CREATE PROCEDURE `drop_legacy_kyc_column`(IN column_name_to_drop varchar(64))
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_verifications'
      AND COLUMN_NAME = column_name_to_drop
  ) THEN
    SET @drop_column_sql = CONCAT(
      'ALTER TABLE `user_verifications` DROP COLUMN `',
      REPLACE(column_name_to_drop, '`', '``'),
      '`'
    );
    PREPARE drop_column_statement FROM @drop_column_sql;
    EXECUTE drop_column_statement;
    DEALLOCATE PREPARE drop_column_statement;
  END IF;
END$$
DELIMITER ;

CALL `drop_legacy_kyc_column`('full_name');
CALL `drop_legacy_kyc_column`('date_of_birth');
CALL `drop_legacy_kyc_column`('gender');
CALL `drop_legacy_kyc_column`('nationality');
CALL `drop_legacy_kyc_column`('address');
CALL `drop_legacy_kyc_column`('identity_number');
CALL `drop_legacy_kyc_column`('identity_front_url');
CALL `drop_legacy_kyc_column`('identity_back_url');
CALL `drop_legacy_kyc_column`('selfie_url');

DROP PROCEDURE `drop_legacy_kyc_column`;
