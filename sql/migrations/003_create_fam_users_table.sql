-- ============================================================================
-- Migration: 003_create_fam_users_table.sql
-- Description: Tạo bảng fam_users — lưu thông tin tài khoản BingX FAM
-- Notes: Dùng để verify khi người dùng đăng ký
-- Created: 2026-07-01
-- ============================================================================

CREATE TABLE IF NOT EXISTS fam_users (
    uid TEXT PRIMARY KEY,
    email TEXT,
    telegram_account TEXT,
    discord_account TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
