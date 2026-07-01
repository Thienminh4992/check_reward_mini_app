-- ============================================================================
-- Migration: 002_add_auth_columns.sql
-- Description: Thêm cột xác thực vào bảng users
--            - password_hash: mật khẩu hash
--            - email: email người dùng
--            - telegram_account: tài khoản Telegram để verify
--            - discord_account: tài khoản Discord để verify
-- Notes: Dựa trên sql/migrations/001_auth_fam_users.sql gốc
-- Created: 2026-07-01
-- ============================================================================

-- Thêm các cột xác thực (nếu chưa có)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS telegram_account TEXT,
    ADD COLUMN IF NOT EXISTS discord_account TEXT;

-- Tạo index cho uid (dùng để login nhanh)
CREATE INDEX IF NOT EXISTS idx_users_uid ON users (uid);
