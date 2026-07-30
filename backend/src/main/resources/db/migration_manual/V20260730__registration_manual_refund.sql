-- Chạy một lần trên database hiện có trước khi khởi động bản code mới.
ALTER TABLE `Registration`
  DROP CHECK `chk_registration_payment_status`;

ALTER TABLE `Registration`
  ADD CONSTRAINT `chk_registration_payment_status`
  CHECK (`paymentStatus` IN (
    'UNPAID', 'PAID', 'REFUND_PENDING', 'REFUNDED', 'FAILED'
  ));

ALTER TABLE `FundTransaction`
  DROP CHECK `chk_fund_transaction_type`;

ALTER TABLE `FundTransaction`
  ADD CONSTRAINT `chk_fund_transaction_type`
  CHECK (`transactionType` IN (
    'REGISTRATION_FEE',
    'REGISTRATION_REFUND',
    'PRIZE_PAYOUT',
    'BETTING_OPERATOR_FEE',
    'MINUS_POOL_SUBSIDY'
  ));
