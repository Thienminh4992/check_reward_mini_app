-- ============================================================================
-- Migration: 012_seed_fam_users.sql
-- Description: Dữ liệu mẫu cho fam_users (test account)
--            Tạo 10 tài khoản BingX test với volume trade
-- Notes: Chạy sau migration 003 (fam_users) và 007 (user_volume_agg)
-- Created: 2026-07-01
-- ============================================================================

-- ============================================================================
-- 1. Seed fam_users (test accounts)
-- ============================================================================
INSERT INTO public.fam_users (uid, email, telegram_account, discord_account, created_at)
VALUES 
    (gen_random_uuid(), 'user01@example.com', '10000001', '@telegram_user01', 'discord_user01', NOW()),
    (gen_random_uuid(), 'user02@example.com', '10000002', '@telegram_user02', 'discord_user02', NOW()),
    (gen_random_uuid(), 'user03@example.com', '10000003', '@telegram_user03', 'discord_user03', NOW()),
    (gen_random_uuid(), 'user04@example.com', '10000004', '@telegram_user04', 'discord_user04', NOW()),
    (gen_random_uuid(), 'user05@example.com', '10000005', '@telegram_user05', 'discord_user05', NOW()),
    (gen_random_uuid(), 'user06@example.com', '10000006', '@telegram_user06', 'discord_user06', NOW()),
    (gen_random_uuid(), 'user07@example.com', '10000007', '@telegram_user07', 'discord_user07', NOW()),
    (gen_random_uuid(), 'user08@example.com', '10000008', '@telegram_user08', 'discord_user08', NOW()),
    (gen_random_uuid(), 'user09@example.com', '10000009', '@telegram_user09', 'discord_user09', NOW()),
    (gen_random_uuid(), 'user10@example.com', '10000010', '@telegram_user10', 'discord_user10', NOW())
ON CONFLICT (uid) DO NOTHING;

-- ============================================================================
-- 2. Seed user_volume_agg (test volume data)
-- ============================================================================
INSERT INTO public.user_volume_agg (uid, total_volume_usd, total_orders, last_updated)
VALUES 
    ('10000001', 12500.50, 120, NOW()),
    ('10000002', 23000.75, 180, NOW()),
    ('10000003', 10850.25, 70, NOW()),
    ('10000004', 51000.00, 350, NOW()),
    ('10000005', 32000.40, 220, NOW()),
    ('10000006', 15640.80, 150, NOW()),
    ('10000007', 78500.30, 480, NOW()),
    ('10000008', 21900.00, 150, NOW()),
    ('10000009', 41200.60, 290, NOW()),
    ('10000010', 10980.10, 90, NOW())
ON CONFLICT (uid) DO UPDATE SET
    total_volume_usd = user_volume_agg.total_volume_usd + EXCLUDED.total_volume_usd,
    total_orders = user_volume_agg.total_orders + EXCLUDED.total_orders,
    last_updated = CURRENT_TIMESTAMP;
