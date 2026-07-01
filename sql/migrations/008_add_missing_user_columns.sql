-- ============================================================================
-- Migration: 008_add_missing_user_columns.sql
-- Description: Thêm các cột còn thiếu của bảng users
--            - phone_number: số điện thoại
--            - address: địa chỉ giao hàng
--            - avatar_url: URL ảnh đại diện
-- Notes: Các cột này xuất hiện trong repository.ts nhưng chưa được tạo
-- Created: 2026-07-01
-- ============================================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_number TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;
