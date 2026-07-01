-- ============================================================================
-- Migration: 011_create_schema_version.sql
-- Description: Tạo bảng _schema_version để theo dõi migration đã chạy
--            Bảng này KHÔNG được rollback — chỉ dùng để check
-- Notes: Tên prefix underscore để tránh xung đột với bảng user
-- Created: 2026-07-01
-- ============================================================================

CREATE TABLE IF NOT EXISTS _schema_version (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    version INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert version 0 (baseline — không có migration)
INSERT INTO _schema_version (version, name)
VALUES (0, 'initial_schema')
ON CONFLICT (version) DO NOTHING;
