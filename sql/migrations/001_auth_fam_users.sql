-- ============================================================================
-- Migration: 001_auth_fam_users.sql (DEPRECATED — đã tách thành 002 và 003)
-- Description: CŨ — Tạo bảng fam_users + thêm cột auth vào users
-- Notes: Migration cũ, đã được tách thành:
--        - 002_add_auth_columns.sql (thêm cột auth)
--        - 003_create_fam_users_table.sql (tạo bảng FAM)
-- Created: unknown
-- Deprecated: 2026-07-01
-- ============================================================================

-- Chạy thủ công trên PostgreSQL trước khi deploy phiên bản có đăng nhập UID/mật khẩu.

CREATE TABLE IF NOT EXISTS fam_users (
    uid text PRIMARY KEY,
    email text,
    telegram_account text,
    discord_account text,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash text,
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS telegram_account text,
    ADD COLUMN IF NOT EXISTS discord_account text;

CREATE INDEX IF NOT EXISTS idx_users_uid ON users (uid);
