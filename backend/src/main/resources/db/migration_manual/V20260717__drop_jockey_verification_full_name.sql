USE `horse_racing_system`;

-- Identity data comes from Didit KYC. The professional Jockey application
-- stores only licence, trainer, and racing-profile information.
ALTER TABLE `JockeyVerification`
  DROP COLUMN `fullName`;
