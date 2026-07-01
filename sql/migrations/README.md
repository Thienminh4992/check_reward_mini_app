# 📦 SQL Migrations

Dùng **raw SQL migration files** để quản lý schema PostgreSQL.

## Cấu trúc

```
sql/migrations/
├── 001_create_users_table.sql              # Bảng users (cơ bản)
├── 002_add_auth_columns.sql                # Thêm cột xác thực (password_hash, email, ...)
├── 003_create_fam_users_table.sql          # Bảng FAM (BingX test accounts)
├── 004_create_rewards_table.sql            # Bảng rewards (quà tặng)
├── 005_create_redeem_requests_table.sql    # Bảng redeem_requests (yêu cầu đổi quà)
├── 006_create_user_points_history.sql      # Bảng user_points_history (lịch sử điểm)
├── 007_create_user_volume_agg.sql          # Bảng user_volume_agg (tổng hợp volume)
├── 008_add_missing_user_columns.sql        # Thêm cột còn thiếu (phone, address, avatar)
├── 009_add_redeem_admin_note.sql           # Thêm admin_note vào redeem_requests
├── 010_add_unique_user_reward.sql          # UNIQUE constraint (user_id, reward_id)
├── 011_create_schema_version.sql           # Bảng _schema_version (track migrations)
├── 012_seed_fam_users.sql                  # Dữ liệu mẫu FAM + volume test
└── README.md                               # File này
```

## Cách chạy migrations

### Option 1: Chạy thủ công (development)

```bash
# Kết nối database
psql -U postgres -d check_reward_db

# Chạy từng file theo thứ tự
\i sql/migrations/001_create_users_table.sql
\i sql/migrations/002_add_auth_columns.sql
# ...
\i sql/migrations/012_seed_fam_users.sql
```

Hoặc chạy từ terminal:

```bash
# Chạy tất cả theo thứ tự (bash)
for f in sql/migrations/0*.sql; do
    echo "Running: $f"
    psql -U postgres -d check_reward_db -f "$f"
done

# Hoặc dùng node script (nếu có)
npx ts-node scripts/run-migrations.ts
```

### Option 2: Dùng node script (production-ready)

Tạo file `scripts/run-migrations.ts`:

```typescript
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
    const migrationsDir = path.join(__dirname, '../sql/migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql') && f !== 'README.md')
        .sort();

    for (const file of files) {
        const version = parseInt(file.split('_')[0], 10);
        
        // Check đã chạy chưa
        const result = await pool.query(
            'SELECT id FROM _schema_version WHERE version = $1',
            [version]
        );

        if (result.rowCount === 0) {
            console.log(`[MIGRATING] ${file}`);
            
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
            
            // Bắt đầu transaction
            await pool.query('BEGIN');
            try {
                await pool.query(sql);
                await pool.query(
                    'INSERT INTO _schema_version (version, name) VALUES ($1, $2)',
                    [version, file]
                );
                await pool.query('COMMIT');
                console.log(`[DONE] ${file}`);
            } catch (err) {
                await pool.query('ROLLBACK');
                console.error(`[FAILED] ${file}`, err);
                throw err;
            }
        } else {
            console.log(`[SKIPPED] ${file} (đã chạy)`);
        }
    }
}

runMigrations()
    .then(() => {
        console.log('All migrations completed.');
        pool.end();
    })
    .catch(err => {
        console.error('Migration failed:', err);
        pool.end();
        process.exit(1);
    });
```

Chạy:

```bash
npx ts-node scripts/run-migrations.ts
```

## Cách rollback (nếu cần)

**KHÔNG có automatic rollback** với raw SQL.

Để rollback:

1. Tạo file migration mới **ngược lại** (ví dụ: `013_remove_column.sql`)
2. Chạy file đó với `ALTER TABLE ... DROP COLUMN ...`

```sql
-- 013_remove_column.sql
ALTER TABLE users DROP COLUMN IF EXISTS telegram_account;
```

## Migration policy

- ✅ Luôn dùng `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` — idempotent
- ✅ Không sửa file đã chạy (tạo file mới thay vì sửa)
- ✅ Đặt tên theo số thứ tự `001_`, `002_`, ...
- ✅ Có comment giải thích migration làm gì
- ❌ Không xóa file migration đã commit
- ❌ Không xóa data trong migration (trừ seed files)
