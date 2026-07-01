-- ============================================================================
-- Migration: 007_create_user_volume_agg.sql
-- Description: Tạo bảng user_volume_agg — tổng hợp volume giao dịch
--            Dùng để tính toán earned_point tự động
-- Created: 2026-07-01
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_volume_agg (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid TEXT NOT NULL UNIQUE REFERENCES fam_users(uid) ON DELETE CASCADE,
    total_volume_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
