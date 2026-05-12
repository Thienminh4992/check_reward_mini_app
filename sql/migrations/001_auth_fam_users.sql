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
