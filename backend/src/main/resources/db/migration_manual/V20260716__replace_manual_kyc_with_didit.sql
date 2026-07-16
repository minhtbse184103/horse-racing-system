USE `horse_racing_system`;

-- Back up production data before running this migration. Legacy document URLs and
-- full identity numbers are deliberately removed and cannot be reconstructed.
ALTER TABLE `OwnerApplication` DROP FOREIGN KEY `OwnerApplication_ibfk_2`;
ALTER TABLE `OwnerApplication` DROP COLUMN `kycVerificationID`;

ALTER TABLE `user_verifications` DROP FOREIGN KEY `user_verifications_ibfk_2`;
ALTER TABLE `user_verifications` DROP INDEX `user_id`;
ALTER TABLE `user_verifications` DROP INDEX `identity_number`;

-- Existing manual records are not provider decisions and must not open wallets.
TRUNCATE TABLE `user_verifications`;

ALTER TABLE `user_verifications` DROP CHECK `chk_user_verification_status`;
ALTER TABLE `user_verifications` DROP CHECK `chk_user_verification_review`;
ALTER TABLE `user_verifications` DROP CHECK `chk_user_verification_rejection`;

ALTER TABLE `user_verifications`
  DROP COLUMN `full_name`,
  DROP COLUMN `date_of_birth`,
  DROP COLUMN `gender`,
  DROP COLUMN `nationality`,
  DROP COLUMN `address`,
  DROP COLUMN `identity_number`,
  DROP COLUMN `identity_front_url`,
  DROP COLUMN `identity_back_url`,
  DROP COLUMN `selfie_url`,
  DROP COLUMN `reviewed_at`,
  DROP COLUMN `reviewed_by`,
  MODIFY COLUMN `status` varchar(30) NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN `provider` varchar(30) NOT NULL DEFAULT 'DIDIT' AFTER `user_id`,
  ADD COLUMN `provider_session_id` varchar(100) NOT NULL AFTER `provider`,
  ADD COLUMN `provider_session_number` bigint NULL AFTER `provider_session_id`,
  ADD COLUMN `workflow_id` varchar(100) NOT NULL AFTER `provider_session_number`,
  ADD COLUMN `vendor_data` varchar(100) NOT NULL AFTER `workflow_id`,
  ADD COLUMN `verification_url` text NULL AFTER `vendor_data`,
  ADD COLUMN `id_verification_status` varchar(40) NULL AFTER `status`,
  ADD COLUMN `liveness_status` varchar(40) NULL AFTER `id_verification_status`,
  ADD COLUMN `face_match_status` varchar(40) NULL AFTER `liveness_status`,
  ADD COLUMN `ip_analysis_status` varchar(40) NULL AFTER `face_match_status`,
  ADD COLUMN `verified_full_name` varchar(150) NULL AFTER `ip_analysis_status`,
  ADD COLUMN `verified_date_of_birth` date NULL AFTER `verified_full_name`,
  ADD COLUMN `document_type` varchar(50) NULL AFTER `verified_date_of_birth`,
  ADD COLUMN `document_last_four` varchar(4) NULL AFTER `document_type`,
  ADD COLUMN `document_expiry_date` date NULL AFTER `document_last_four`,
  ADD COLUMN `face_match_score` decimal(8,4) NULL AFTER `document_expiry_date`,
  ADD COLUMN `attempt_number` int NOT NULL AFTER `face_match_score`,
  ADD COLUMN `verified_at` datetime NULL AFTER `submitted_at`,
  ADD UNIQUE KEY `uk_user_verifications_provider_session` (`provider_session_id`),
  ADD UNIQUE KEY `uk_user_verification_attempt` (`user_id`, `attempt_number`),
  ADD KEY `idx_user_verifications_status` (`status`);

ALTER TABLE `user_verifications`
  ADD CONSTRAINT `chk_user_verification_status` CHECK (`status` IN (
    'NOT_STARTED', 'IN_PROGRESS', 'AWAITING_USER', 'IN_REVIEW',
    'VERIFIED', 'REJECTED', 'RESUBMITTED', 'EXPIRED', 'ABANDONED'
  ));

CREATE TABLE `didit_webhook_events` (
  `webhook_event_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `event_id` varchar(120) UNIQUE NOT NULL,
  `provider_session_id` varchar(100) NOT NULL,
  `event_type` varchar(80),
  `provider_status` varchar(50),
  `received_at` datetime NOT NULL,
  `processed_at` datetime,
  `processing_error` varchar(500),
  KEY `idx_didit_webhook_session` (`provider_session_id`)
);
