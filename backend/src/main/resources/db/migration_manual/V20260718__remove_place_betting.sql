USE horse_racing_system;

DELETE FROM `BetSettlement`
WHERE `betEventID` IN (
  SELECT `betEventID`
  FROM `BetEvent`
  WHERE `betProductID` IN (
    SELECT `betProductID`
    FROM `BetProduct`
    WHERE `code` = 'PLACE'
  )
);

DELETE FROM `WalletTransaction`
WHERE `referenceType` = 'BET_TICKET'
  AND `referenceID` IN (
    SELECT `betTicketID`
    FROM `BetTicket`
    WHERE `betEventID` IN (
      SELECT `betEventID`
      FROM `BetEvent`
      WHERE `betProductID` IN (
        SELECT `betProductID`
        FROM `BetProduct`
        WHERE `code` = 'PLACE'
      )
    )
  );

DELETE FROM `BetTicket`
WHERE `betEventID` IN (
  SELECT `betEventID`
  FROM `BetEvent`
  WHERE `betProductID` IN (
    SELECT `betProductID`
    FROM `BetProduct`
    WHERE `code` = 'PLACE'
  )
);

DELETE FROM `BetEvent`
WHERE `betProductID` IN (
  SELECT `betProductID`
  FROM `BetProduct`
  WHERE `code` = 'PLACE'
);

DELETE FROM `BetProduct`
WHERE `code` = 'PLACE';

UPDATE `Wallet` wallet
SET `lockedBalance` = COALESCE((
  SELECT SUM(ticket.`stake`)
  FROM `BetTicket` ticket
  WHERE ticket.`walletID` = wallet.`walletID`
    AND ticket.`status` = 'PLACED'
), 0);

ALTER TABLE `BetProduct`
  DROP CHECK `chk_bet_product_code`;

ALTER TABLE `BetProduct`
  ADD CONSTRAINT `chk_bet_product_code`
  CHECK (`code` IN ('WIN'));
