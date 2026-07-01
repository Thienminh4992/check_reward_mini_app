# 🎁 Check Reward Mini App

**Telegram Mini App** — Hệ thống tích lũy điểm theo volume giao dịch và đổi quà tặng.

---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ](#-công-nghệ)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Luồng hoạt động](#-luồng-hoạt-động)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Tính năng

### Người dùng (User)
- **Đăng nhập/Đăng ký** — Xác thực qua UID BingX + mật khẩu, xác minh Telegram WebApp
- **FAM Verification** — Đăng ký yêu cầu khớp thông tin với database FAM (email/Telegram/Discord)
- **Dashboard** — Xem điểm hiện có, volume giao dịch, lịch sử điểm
- **Đổi quà** — Yêu cầu đổi quà từ điểm tích lũy
- **Quản lý tài khoản** — Cập nhật profile, đổi mật khẩu, upload avatar

### Quản trị viên (Admin)
- **Duyệt đổi quà** — Approve/Reject các yêu cầu đổi quà
- **Quản lý người dùng** — Xem, tạo, chỉnh sửa, xóa tài khoản
- **Quản lý quà tặng** — Thêm, sửa, xóa, ẩn quà tặng
- **Thống kê** — Xem danh sách giao dịch đổi quà đã được duyệt
- **Import Volume** — Import volume giao dịch từ file CSV (tự động cộng dồn theo UID)

---

## 🛠 Công nghệ

| Lớp | Công cụ |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, Tailwind CSS 4, framer-motion |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (pg) |
| **ORM** | Raw SQL (Prisma config sẵn nhưng chưa dùng fully) |
| **Authentication** | JWT (jsonwebtoken), bcryptjs |
| **Telegram** | Telegram WebApp SDK |
| **CSV Parsing** | Papaparse |
| **Excel** | ExcelJS |
| **Icons** | lucide-react |

---

## 📦 Yêu cầu hệ thống

- **Node.js** >= 20.x
- **PostgreSQL** >= 14.x
- **npm** / **pnpm** / **yarn**

---

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd check_reward_mini_app
```

### 2. Cài dependencies

```bash
npm install
# hoặc
pnpm install
# hoặc
yarn install
```

### 3. Cấu hình môi trường

Tạo file `.env.local` (xem [Cấu hình môi trường](#-cấu-hình-môi-trường) bên dưới):

```bash
cp .env.example .env.local
```

### 4. Thiết lập Database

Chạy các câu SQL trong [`schema_database/schema.sql`](schema_database/schema.sql) để tạo bảng.

### 5. Chạy development server

```bash
npm run dev
# hoặc
pnpm dev
# hoặc
yarn dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

---

## 🔧 Cấu hình môi trường

Tạo file `.env.local` với các biến sau:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/check_reward_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Telegram Bot (để verify initData)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Node Environment
NODE_ENV=development
```

### Giải thích các biến

| Biến | Mô tả | Bắt buộc |
|---|---|---|
| `DATABASE_URL` | Connection string tới PostgreSQL | ✅ |
| `JWT_SECRET` | Khóa bí mật để ký JWT token (tối thiểu 32 ký tự) | ✅ |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram để xác thực initData | ❌ (nếu không có sẽ dùng mock user) |
| `NODE_ENV` | `development` hoặc `production` | ❌ |

---

## 🗄 Database Schema

### `users` — Thông tin người dùng

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `telegram_id` | BigInt | ID tài khoản Telegram |
| `telegram_name` | VARCHAR | Tên Telegram |
| `uid` | VARCHAR | UID BingX (unique) |
| `name` | VARCHAR | Tên hiển thị |
| `role` | VARCHAR | `user` hoặc `admin` |
| `earned_point` | INTEGER | Tổng điểm đã tích lũy |
| `redeemed_point` | INTEGER | Điểm đã sử dụng |
| `available_point` | INTEGER | Điểm khả dụng |
| `email` | VARCHAR | Email |
| `phone_number` | VARCHAR | Số điện thoại |
| `address` | VARCHAR | Địa chỉ giao hàng |
| `avatar_url` | VARCHAR | Link ảnh đại diện |
| `password_hash` | VARCHAR | Hash mật khẩu |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật |

### `rewards` — Quà tặng

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Tên quà |
| `description` | TEXT | Mô tả |
| `image_url` | VARCHAR | Link ảnh quà |
| `required_points` | INTEGER | Điểm cần để đổi |
| `stock` | INTEGER | Số lượng tồn |
| `is_active` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật |

### `redeem_requests` — Yêu cầu đổi quà

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID (FK) | FK → users |
| `reward_id` | UUID (FK) | FK → rewards |
| `quantity` | INTEGER | Số lượng muốn đổi |
| `status` | VARCHAR | `pending`, `approved`, `rejected` |
| `proof_image` | JSONB | Hình ảnh bằng chứng |
| `shipping_info` | JSONB | Thông tin giao hàng |
| `admin_note` | TEXT | Ghi chú admin |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật |

**Constraint:** `UNIQUE(user_id, reward_id)` — Mỗi user chỉ được đổi 1 lần/quà.

### `user_points_history` — Lịch sử điểm

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID (FK) | FK → users |
| `reward_id` | UUID (FK) | FK → rewards |
| `points_change` | INTEGER | Số điểm (dương/âm) |
| `source` | VARCHAR | `redeem`, `refund`, v.v. |
| `description` | TEXT | Mô tả |
| `created_at` | TIMESTAMP | Thời gian tạo |

### `user_volume_agg` — Tổng hợp volume

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `uid` | VARCHAR (PK) | UID BingX |
| `total_volume_usd` | DECIMAL | Tổng volume USD |
| `total_orders` | INTEGER | Số đơn hàng |
| `last_updated` | TIMESTAMP | Thời gian cập nhật cuối |

### `fam_users` — Dữ liệu FAM (BingX)

| Cột | Kiểu | Mô tả |
|---|---|---|
| `uid` | VARCHAR | UID BingX |
| `email` | VARCHAR | Email BingX |
| `telegram_account` | VARCHAR | Tài khoản Telegram |
| `discord_account` | VARCHAR | Tài khoản Discord |

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập |
| `POST` | `/api/auth/register` | Đăng ký mới |
| `POST` | `/api/auth/logout` | Đăng xuất |

### User

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/users/me` | Thông tin user hiện tại |
| `PUT` | `/api/users/update-profile` | Cập nhật profile |
| `PUT` | `/api/users/change-password` | Đổi mật khẩu |
| `PUT` | `/api/users/avatar` | Upload avatar |

### Reward (Public)

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/rewards` | Danh sách quà active |
| `POST` | `/api/redeem` | Tạo yêu cầu đổi quà |

### Upload

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/upload` | Upload ảnh (admin only) |

### Admin

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/admin/redeem-requests` | Danh sách yêu cầu đổi quà |
| `POST` | `/api/admin/redeem-requests/:id/approve` | Duyệt yêu cầu |
| `POST` | `/api/admin/redeem-requests/:id/reject` | Từ chối yêu cầu |
| `GET` | `/api/admin/users` | Danh sách người dùng |
| `POST` | `/api/admin/users` | Tạo người dùng mới |
| `PUT` | `/api/admin/users/:id` | Cập nhật người dùng |
| `DELETE` | `/api/admin/users/:id` | Xóa người dùng |
| `GET` | `/api/admin/rewards` | Danh sách quà (bao gồm ẩn) |
| `POST` | `/api/admin/rewards` | Tạo quà mới |
| `PUT` | `/api/admin/rewards/:id` | Cập nhật quà |
| `DELETE` | `/api/admin/rewards/:id` | Ẩn quà (soft delete) |
| `GET` | `/api/admin/stats` | Thống kê đã duyệt |
| `GET` | `/api/admin/export-stats` | Export thống kê |
| `POST` | `/api/admin/import-volume` | Import volume từ CSV |

---

## 🔄 Luồng hoạt động

### 1. Đăng nhập

```
Người dùng nhập UID + mật khẩu
  → Verify Telegram initData
  → Tìm user theo UID trong DB
  → Kiểm tra mật khẩu
  → Kiểm tra telegram_id khớp
  → Sign JWT → Set cookie session_token
  → Chuyển hướng đến /home
```

### 2. Đăng ký (FAM Verification)

```
Người dùng nhập email, UID, telegram, discord, password
  → Kiểm tra UID chưa tồn tại
  → Kiểm tra telegram_id chưa được dùng
  → Tìm trong fam_users theo uid
  → Kiểm tra: ít nhất 1 trong email/telegram/discord khớp
  → Hash password → Tạo user mới
  → Sign JWT → Chuyển hướng đến /home
```

### 3. Đổi quà

```
User chọn quà → Nhập số lượng
  → Kiểm tra: đủ available_point?
  → Kiểm tra: đủ stock?
  → BEGIN Transaction
    → Trừ stock reward
    → Tăng redeemed_point, giảm available_point
    → Tạo redeem_requests (status: pending)
    → Lưu lịch sử điểm (source: redeem)
  → COMMIT
  → Trả về success
```

### 4. Admin xử lý yêu cầu

**Approve:**
```
Admin nhấn Approve
  → Kiểm tra status == pending
  → Cập nhật status = approved
  → Lưu lịch sử (source: refund)
```

**Reject:**
```
Admin nhấn Reject → Nhập lý do
  → Kiểm tra status == pending
  → Hoàn điểm: giảm redeemed_point, tăng available_point
  → Tăng lại stock reward
  → Cập nhật status = rejected
  → Lưu lịch sử (source: refund)
```

### 5. Import Volume từ CSV

```
Admin upload file CSV
  → Parse CSV (Papaparse, delimiter: ;)
  → Parse volume (hỗ trợ định dạng VN: 99.073.049)
  → Nhóm theo UID, cộng dồn volume
  → Upsert vào user_volume_agg (ON CONFLICT UPDATE)
  → Tự động sync điểm: earned_point = total_volume_usd
```

### 6. Đồng bộ điểm tự động (Auto Sync)

Mỗi khi user vào trang `/home`:
```
Lấy volume từ user_volume_agg
  → Nếu volume > earned_point
    → Cập nhật earned_point = volume
    → available_point = earned_point - redeemed_point
```

---

## 📁 Cấu trúc dự án

```
check_reward_mini_app/
├── prisma/
│   └── schema.prisma              # Prisma config (PostgreSQL)
├── schema_database/
│   └── schema.sql                 # Notes DB schema
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (UserProvider, BottomNav)
│   │   ├── page.tsx               # Redirect / → /login
│   │   ├── login/page.tsx         # Trang đăng nhập
│   │   ├── register/page.tsx      # Trang đăng ký
│   │   ├── home/page.tsx          # Dashboard chính
│   │   ├── admin/page.tsx         # Trang admin
│   │   ├── reward/page.tsx        # Trang reward
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/              # Login, Register, Logout
│   │   │   ├── users/             # Profile, Password, Avatar
│   │   │   ├── rewards/           # Danh sách quà
│   │   │   ├── redeem/            # Tạo yêu cầu đổi quà
│   │   │   ├── upload/            # Upload ảnh
│   │   │   └── admin/             # Admin endpoints
│   │   └── services/              # Client-side API services
│   │       ├── auth.ts
│   │       ├── reward.ts
│   │       ├── redeem.ts
│   │       └── admin.ts
│   ├── components/                # UI Components
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   ├── UserCard.tsx
│   │   ├── RewardList.tsx
│   │   ├── RewardHistory.tsx
│   │   ├── RedeemRequestTable.tsx
│   │   ├── UserManagementTable.tsx
│   │   ├── ApprovedRedeemStatsTable.tsx
│   │   └── ImportVolumeTab.tsx
│   ├── context/
│   │   └── UserContext.tsx        # React Context (user state)
│   ├── lib/                       # Core utilities
│   │   ├── db.ts                  # PG connection pool
│   │   ├── auth.ts                # JWT sign/verify
│   │   ├── telegram.ts            # Telegram initData verify
│   │   ├── fam-verify.ts          # FAM verification
│   │   ├── password.ts            # Password hash/verify
│   │   ├── validators.ts          # Email, phone validation
│   │   ├── repository.ts          # Repository pattern
│   │   └── volume.repository.ts   # Volume upsert
│   ├── services/                  # Server-side services
│   │   ├── user.service.ts
│   │   └── volume.service.ts
│   ├── types/
│   │   ├── user.ts
│   │   └── reward.ts
│   ├── db/
│   │   └── schema.ts              # DB entity types
│   └── middleware.ts
├── public/
│   └── images/
│       ├── avatar/
│       └── rewards/
├── plans/
│   └── project-summary.md         # Chi tiết phân tích dự án
├── Dockerfile
├── package.json
├── next.config.mjs
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🐳 Deployment

### Docker

Ứng dụng đã được config `output: "standalone"` trong [`next.config.mjs`](next.config.mjs) để tối ưu Docker build.

```bash
# Build Docker image
docker build -t check-reward-mini-app .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your-secret \
  -e TELEGRAM_BOT_TOKEN=your-bot-token \
  check-reward-mini-app
```

### Variables môi trường trong production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=super-secret-key-min-32-chars
TELEGRAM_BOT_TOKEN=your-bot-token
```

---

## 👥 Vai trò trong hệ thống

| Vai trò | Quyền hạn |
|---|---|
| **Guest** | Chưa đăng nhập → Chỉ thấy trang login/register |
| **User** | Đăng nhập → Dashboard, đổi quà, update profile |
| **Admin** | Tất cả của User + trang admin (duyệt quà, quản lý user/rewards, import volume) |

---

## 📝 Notes quan trọng

1. **Unique constraint**: Mỗi user chỉ được đổi 1 lần mỗi reward (`UNIQUE(user_id, reward_id)`).
2. **Transaction safety**: Quy trình đổi quà đảm bảo tính nhất quán với transaction.
3. **Auto sync điểm**: Điểm được tự động cập nhật từ volume khi user vào trang chủ.
4. **FAM Verification**: Đăng ký yêu cầu thông tin khớp với database FAM BingX.
5. **Telegram verify**: UID đăng nhập phải khớp với Telegram đang mở mini app.
6. **Soft delete**: Rewards bị "xóa" thực chất là set `is_active = false`.
7. **Volume import**: Hỗ trợ định dạng số Việt Nam (dấu chấm = phân cách nghìn).

---

## 📄 License

[Thêm license tại đây]

---

## 👤 Liên hệ

[Thêm thông tin liên hệ tại đây]
