-- ============================================================================
-- Migration: 010_add_unique_user_reward.sql
-- Description: Thêm UNIQUE constraint (user_id, reward_id) trên redeem_requests
--            Ngăn user đổi cùng 1 reward nhiều lần
--            Error code: 23505 (duplicate key value violates unique constraint)
-- Notes: Dựa trên schema_database/schema.sql ghi chú ban đầu
-- Created: 2026-07-01
-- ============================================================================

-- Tạo UNIQUE constraint
ALTER TABLE redeem_requests
    ADD CONSTRAINT unique_user_reward UNIQUE (user_id, reward_id);

ALTER TABLE redeem_requests DROP CONSTRAINT IF EXISTS unique_user_reward;
