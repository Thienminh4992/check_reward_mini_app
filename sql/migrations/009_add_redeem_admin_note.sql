-- ============================================================================
-- Migration: 009_add_redeem_admin_note.sql
-- Description: Thêm cột admin_note vào bảng redeem_requests
--            - admin_note: ghi chú của admin khi approve/reject
-- Notes: Xuất hiện trong repository.ts:329
-- Created: 2026-07-01
-- ============================================================================

ALTER TABLE redeem_requests
    ADD COLUMN IF NOT EXISTS admin_note TEXT;
