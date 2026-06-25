USE horse_racing_system;

ALTER TABLE `OwnerApplication`
  ADD COLUMN `identityDocumentUrl` TEXT NULL AFTER `address`,
  ADD COLUMN `stableName` VARCHAR(255) NULL AFTER `identityDocumentUrl`,
  ADD COLUMN `stableAddress` VARCHAR(500) NULL AFTER `stableName`,
  ADD COLUMN `stableCertificateUrl` TEXT NULL AFTER `stableAddress`,
  ADD COLUMN `totalHorsesOwned` INT NULL AFTER `stableCertificateUrl`,
  ADD COLUMN `horseOwnershipProofUrl` TEXT NULL AFTER `totalHorsesOwned`;

UPDATE `OwnerApplication`
SET
  `identityDocumentUrl` = COALESCE(`identityDocumentUrl`, ''),
  `stableName` = COALESCE(`stableName`, 'Existing stable information pending update'),
  `stableAddress` = COALESCE(`stableAddress`, `address`),
  `stableCertificateUrl` = COALESCE(`stableCertificateUrl`, ''),
  `totalHorsesOwned` = COALESCE(NULLIF(`totalHorsesOwned`, 0), 1),
  `horseOwnershipProofUrl` = COALESCE(`horseOwnershipProofUrl`, ''),
  `submittedAt` = COALESCE(`submittedAt`, `createdAt`, NOW())
WHERE
  `applicationID` > 0
  AND (
    `identityDocumentUrl` IS NULL
    OR `stableName` IS NULL
    OR `stableAddress` IS NULL
    OR `stableCertificateUrl` IS NULL
    OR `totalHorsesOwned` IS NULL
    OR `totalHorsesOwned` < 1
    OR `horseOwnershipProofUrl` IS NULL
    OR `submittedAt` IS NULL
  );

ALTER TABLE `OwnerApplication`
  MODIFY COLUMN `identityDocumentUrl` TEXT NOT NULL,
  MODIFY COLUMN `stableName` VARCHAR(255) NOT NULL,
  MODIFY COLUMN `stableAddress` VARCHAR(500) NOT NULL,
  MODIFY COLUMN `stableCertificateUrl` TEXT NOT NULL,
  MODIFY COLUMN `totalHorsesOwned` INT NOT NULL,
  MODIFY COLUMN `horseOwnershipProofUrl` TEXT NOT NULL,
  MODIFY COLUMN `submittedAt` DATETIME NOT NULL,
  ADD CONSTRAINT `chk_owner_total_horses`
    CHECK (`totalHorsesOwned` >= 1),
  ADD CONSTRAINT `chk_owner_application_status`
    CHECK (`status` IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD CONSTRAINT `chk_owner_reject_reason`
    CHECK (
      (`status` = 'REJECTED'
        AND `rejectReason` IS NOT NULL
        AND CHAR_LENGTH(TRIM(`rejectReason`)) > 0)
      OR
      `status` <> 'REJECTED'
    );
