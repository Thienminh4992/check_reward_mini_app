# Phân Tích Dự án Check Reward Mini App — Issues & Khuyến Nghị Cải Tiến

---

## ✅ Điểm Tốt

### 1. **Service Layer rõ ràng**
Phân tách rõ `services/` (business logic) → `lib/repository.ts` (data access) → `lib/db.ts` (DB connection). Pattern này dễ maintain và test.

### 2. **Repository Pattern**
Viết raw SQL trong repository giúp kiểm soát hoàn toàn query, tránh overhead của ORM. Transaction wrapper [`withTransaction()`](src/lib/db.ts:37) được sử dụng đúng chỗ.

### 3. **FAM Verification**
Logic xác thực người dùng BingX qua FAM database với multiple match fields (email/telegram/discord) là thiết kế tốt cho use-case thực tế.

### 4. **Auto Points Sync**
Cơ chế tự động sync điểm từ volume khi vào dashboard — giảm sự phụ thuộc vào cron job.

### 5. **Unique Constraint phòng spam**
`UNIQUE(user_id, reward_id)` trên [`redeem_requests`](schema_database/schema.sql:6) + catch error `23505` là cách làm an toàn ở DB level.

### 6. **Dynamic Import**
RewardList được load dynamic với loading skeleton — cải thiện UX.

---

## ⚠️ Vấn Đề Cấu Trúc

### 1. **Thiếu `.env.example`**
Không có file template cho environment variables. Người mới cloning phải tự đọc code để biết cần những biến gì.

### 2. **`prisma/schema.prisma` trống**
Chỉ có config provider, không có model definitions. Dự án dùng raw SQL nhưng vẫn giữ Prisma → gây nhầm lẫn, không cần thiết.

```prisma
// prisma/schema.prisma — chỉ có 8 dòng, không có model
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. **File API route trống/điếu sót**
[`src/app/api/admin/rewards/route.ts`](src/app/api/admin/rewards/route.ts) chỉ có 99 dòng, **chỉ có GET và POST, thiếu PUT/DELETE**. Logic update/delete có thể cần ở [`[id]/route.ts`](src/app/api/admin/rewards/[id]/route.ts) nhưng cần kiểm tra.

### 4. **Duplicate file names trong workspace**
Environment details hiển thị `src/services/volume.service.ts` và `src/lib/volume.repository.ts` xuất hiện 2 lần → có thể có file trùng tên hoặc workspace confusion.

### 5. **`schema_database/schema.sql` chỉ là notes**
File này không phải SQL chạy được, mà là ghi chú về cách tạo constraint. Schema thật nằm ở PostgreSQL remote — không có migration files để version control.

---

## 🔴 Vấn Đề Quan Trọng (Critical)

### 1. **JWT expire quá ngắn (15 phút)**

```typescript
// src/lib/auth.ts:18
export function signToken(payload: SessionPayload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "15m", // ← đổi từ "7d"
    });
}
```

**Vấn đề:** 15 phút là quá ngắn cho Telegram Mini App. User sẽ bị logout liên tục, đặc biệt khi làm việc với admin.

**Giải pháp:**
- Sử dụng **refresh token** pattern: access token (15 phút) + refresh token (7 ngày)
- Hoặc tăng expiration cho cookie-based auth lên 24h–7 ngày
- Thêm endpoint `/api/auth/refresh` để refresh token mà không cần login lại

---

### 2. **Middleware không bảo vệ admin routes**

Không thấy middleware nào bảo vệ `/admin` và `/api/admin/*`. Mỗi route phải tự check admin — dễ bỏ sót.

**Vấn đề:** Nếu bỏ qua check admin trong bất kỳ route nào, bất kỳ ai biết URL đều có thể truy cập.

**Giải pháp:** Tạo middleware tập trung trong [`src/middleware.ts`](src/middleware.ts) để check role cho tất cả admin routes.

---

### 3. **Mock Telegram User bypasses verification**

```typescript
// src/lib/telegram.ts:44-49
export function getMockTelegramUser(): TelegramUser {
    return {
        id: 5661851130,
        username: "mock_user",
        first_name: "Mock User",
    };
}
```

```typescript
// src/app/api/auth/login/route.ts:33-35
if (!body.initData || !process.env.TELEGRAM_BOT_TOKEN) {
    telegramUser = getMockTelegramUser(); // ← BYPASS!
}
```

**Vấn đề:** Khi `TELEGRAM_BOT_TOKEN` không được set hoặc `initData` missing, **toàn bộ app dùng mock user → mọi request đều vượt qua verification**.

**Giải pháp:**
- Bắt buộc `TELEGRAM_BOT_TOKEN` trong production, throw error nếu không có
- Hoặc至少 log warning khi fallback to mock
- Không cho phép đăng ký/login với mock user trong production

---

### 4. **Hardcoded mock Telegram ID**

```typescript
// src/lib/telegram.ts:46
id: 5661851130
```

ID Telegram hardcoded — nếu người khác có cùng ID, họ có thể impersonate user này.

---

### 5. **SSL `rejectUnauthorized: false` trong production**

```typescript
// src/lib/db.ts:3-7
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // ← NGUY HIỂM!
    max: 20,
});
```

**Vấn đề:** Tắt SSL verification là **security vulnerability** nghiêm trọng. Có thể bị MITM (Man-in-the-Middle) attack, attacker có thể đọc/đổi dữ liệu truyền giữa app và database.

**Giải pháp:**
```typescript
ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: true }  // Dùng certificate hợp lệ
    : { rejectUnauthorized: false }  // Chỉ dev
```
Hoặc tốt hơn: sử dụng Cloudflare Postgres, Railway, hoặc provider có SSL hợp lệ.

---

### 6. **Secret key trong env không có validation độ dài**

```typescript
// src/lib/auth.ts:6-7
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
}
```

Chỉ check null/undefined, **không check độ dài**. Nếu đặt giá trị ngắn (ví dụ "123"), JWT sẽ dễ bị brute-force.

**Giải pháp:**
```typescript
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
}
```

---

## 🐛 Issues Từ Code (Bugs)

### 1. **Type error: `volumeRepository.upsertUserVolume` expected 4 args, got 3**

```
src/services/volume.service.ts:54 - TS2554: Expected 4 arguments, but got 3.
```

Hàm [`upsertUserVolume()`](src/lib/volume.repository.ts:6) định nghĩa 4 params nhưng [`volume.service.ts`](src/services/volume.service.ts:54) chỉ truyền 3. Cần fix ngay vì chức năng import volume sẽ lỗi.

---

### 2. **Console.log nhạy cảm trong production**

```typescript
// src/services/user.service.ts:211
console.log("avatar", user?.avatar_url);
```

Log thông tin user có thể expose dữ liệu nhạy cảm.

---

### 3. **Không có rate limiting**

Các endpoint quan trọng không có rate limiting:
- `/api/auth/login` — dễ brute-force
- `/api/auth/register` — dễ spam tạo account
- `/api/redeem` — dễ spam đổi quà
- `/api/admin/import-volume` — dễ overwhelm server

---

### 4. **Input validation thiếu**

- [`admin/users/route.ts`](src/app/api/admin/users/route.ts): POST tạo user không validate `uid`, `name`, `password`
- [`admin/rewards/route.ts:65`](src/app/api/admin/rewards/route.ts:65): Dùng `==` thay vì `===` để so sánh `required_points`

---

### 5. **Soft delete không kiểm tra foreign key**

Xóa reward mềm (`is_active = false`) nhưng `redeem_requests` vẫn tham chiếu đến reward đã ẩn → có thể gây lỗi khi hiển thị lịch sử đổi quà.

---

### 6. **File rewards route trống**

[`src/app/api/admin/rewards/route.ts`](src/app/api/admin/rewards/route.ts) chỉ có 99 dòng — có thể bị cắt ngang. Cần kiểm tra xem PUT/DELETE reward có được implement ở file khác không.

---

## 🏗 Khuyến Nghị Cải Tiến Cấu Trúc

### 1. **Thêm `.env.example`**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/check_reward_db

# JWT
JWT_SECRET=change-this-to-a-random-32-character-string-at-minimum

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Node
NODE_ENV=development
```

---

### 2. **Xóa Prisma hoặc điền schema**

Quyết định:
- **Option A:** Xóa `prisma/` directory — không dùng Prisma, chỉ raw SQL
- **Option B:** Điền đầy đủ model vào `schema.prisma` và dùng `prisma generate` + Prisma Client

Không nên giữ hai cách cùng lúc.

---

### 3. **Tách config ra separate file**

```
src/config/
├── index.ts          # Aggregated config từ process.env
├── auth.config.ts    # JWT config (secret, expiresIn, refresh)
└── db.config.ts      # DB pool config (max connections, SSL)
```

---

### 4. **Thêm validation layer với Zod**

```
src/validators/
├── auth.validator.ts     # Login, Register schemas
├── user.validator.ts     # Profile update schemas
├── reward.validator.ts   # Create/Update reward schemas
└── volume.validator.ts   # CSV row schemas
```

Thay vì validate bằng if/regex trong route, dùng Zod:
```typescript
import { z } from "zod";

const loginSchema = z.object({
    uid: z.string().min(1),
    password: z.string().min(6),
    initData: z.string().optional(),
});
```

---

### 5. **Thêm centralized error handling**

```
src/lib/
├── errors.ts         # Custom error classes (AppError, NotFoundError, etc.)
└── error-handler.ts  # API error response helper
```

---

### 6. **Tạo admin middleware tập trung**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userRepository } from "@/lib/repository";

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await userRepository.getUserById(session.userId);
    if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null; // null = admin confirmed, proceed
}
```

Rồi apply cho tất cả `/api/admin/*`.

---

### 7. **Thêm health check endpoint**

```
src/app/api/health/route.ts  → GET returns { status: "ok", db: "connected" }
```
Cần cho monitoring và load balancer.

---

### 8. **Thêm logging system**

Thay vì `console.log`, dùng `pino` hoặc `winston`:

```
src/lib/logger.ts
```
Với structured logging, log levels (info, warn, error), và file rotation.

---

### 9. **Cải thiện admin reward routes**

Gộp `/api/admin/rewards/[id]/approve` và `/reject` thành một endpoint:

```
PUT /api/admin/rewards/[id] → { action: "approve" | "reject", note?: string }
```

---

### 10. **Tạo database migration system**

Hiện tại schema nằm trong [`schema.sql`](schema_database/schema.sql) như comments. Nên dùng migration tool:
- **Option A:** `knex migrate` — flexible raw SQL
- **Option B:** `prisma migrate` — nếu chọn dùng Prisma
- **Option C:** Custom versioning với folder `migrations/` và script apply

---

### 11. **Thêm tests**

```
__tests__/
├── unit/
│   ├── auth.test.ts
│   ├── fam-verify.test.ts
│   └── volume-parsing.test.ts
├── integration/
│   ├── redeem-flow.test.ts
│   └── import-volume.test.ts
└── e2e/
    └── login-redirect.test.ts
```

Ít nhất cần test cho:
- FAM verification logic
- Redeem flow (transaction)
- Volume import parsing (VN format numbers)

---

### 12. **Document API với OpenAPI/Swagger**

Dùng `swagger-autogen` hoặc `next-swagger-ui` để tự động generate docs từ code.

---

## 📊 Bảng Ưu Tiên

| STT | Vấn Đề | Mức Độ | Khuyến Nghị |
|---|---|---|---|
| 1 | SSL `rejectUnauthorized: false` | 🔴 Critical | Chỉ disable khi dev, production dùng cert hợp lệ |
| 2 | JWT 15 phút expire | 🔴 Critical | Thêm refresh token pattern |
| 3 | Middleware bảo vệ admin | 🔴 Critical | Tạo centralized admin middleware |
| 4 | Mock Telegram bypass | 🔴 Critical | Bắt buộc bot token trong production |
| 5 | Type error volumeRepository | 🟠 High | Fix ngay — import volume sẽ lỗi |
| 6 | Rate limiting | 🟠 High | Thêm rate limiter cho auth/redeem |
| 7. Input validation Zod | 🟡 Medium | Refactor các route validators |
| 8 | Centralized error handling | 🟡 Medium | Custom error classes + handler |
| 9 | `.env.example` | 🟡 Medium | Tạo file template |
| 10 | Prisma decision | 🟡 Medium | Xóa hoặc điền đầy đủ |
| 11 | Logging system | 🟢 Low | Pino/Winston |
| 12 | Health check | 🟢 Low | `/api/health` endpoint |
| 13 | Migration tooling | 🟢 Low | Knex/Prisma migrate |
| 14 | Tests | 🟢 Low | Unit + Integration tests |

---

## 📝 Tổng Kết

Dự án có **nền tảng kiến trúc tốt** với service layer, repository pattern, và transaction management. Tuy nhiên cần ưu tiên:

1. **Fix security issues ngay** (SSL, JWT, mock bypass)
2. **Cải thiện structure** (middleware, validation, config)
3. **Điền khoảng trống** (prisma decision, missing routes)
4. **Tăng maintainability** (logging, tests, migration)
