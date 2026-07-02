-- Drop the unique constraint that blocks re-redemption after reject
-- Allows user to redeem the same reward again after admin rejects
ALTER TABLE redeem_requests DROP CONSTRAINT IF EXISTS unique_user_reward;
