-- ============================================================================
-- Migration: 001_create_users_table.sql
-- Description: Tạo bảng users cơ bản
-- Created: 2026-07-01
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT,
    telegram_name TEXT,
    uid TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    earned_point INTEGER NOT NULL DEFAULT 0,
    redeemed_point INTEGER NOT NULL DEFAULT 0,
    available_point INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Thêm cột password_hash (dùng chung với 002_auth_fam_users.sql)
-- Cột email, telegram_account, discord_account sẽ được tạo ở migration 002
