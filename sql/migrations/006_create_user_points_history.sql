-- ============================================================================
-- Migration: 006_create_user_points_history.sql
-- Description: Tạo bảng user_points_history — lịch sử điểm
-- Created: 2026-07-01
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    points_change INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
