# Plan: Chức năng Import CSV cho Fam Users

## Tổng quan

Thêm chức năng cho admin để import danh sách fam users từ file CSV với định dạng:
```
email;uid;telegram_account;discord_account
```

- Kiểm tra trùng lặp theo `uid`
- Nếu `uid` đã tồn tại → UPDATE lại thông tin
- Nếu `uid` chưa tồn tại → INSERT mới
- Chỉ admin mới có quyền truy cập

---

## Database Schema (fam_users)

Bảng đã tồn tại trong migration `001_auth_fam_users.sql`:

```sql
CREATE TABLE IF NOT EXISTS fam_users (
    uid text PRIMARY KEY,
    email text,
    telegram_account text,
    discord_account text,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
```

---

## Các bước thực hiện

### Bước 1: Thêm repository methods cho Fam Users

**File:** `src/lib/repository.ts`

Thêm các method sau vào cuối object `userRepository` (trước dòng `};` cuối cùng):

#### 1.1 `getFamUsers()` - Lấy danh sách với pagination & search
```typescript
async getFamUsers(
    params: {
        uid?: string
        page?: number
        limit?: number
    },
    client?: PoolClient
)
```
- Query: `SELECT uid, email, telegram_account, discord_account, created_at FROM fam_users`
- Tìm kiếm: `WHERE f.uid ILIKE $value`
- Sắp xếp: `ORDER BY created_at DESC`
- Phân trang: `LIMIT $limit OFFSET $offset`
- Trả về: `{ items: FamUser[], total: number, page: number, limit: number }`

#### 1.2 `upsertFamUser()` - Insert hoặc Update theo uid
```typescript
upsertFamUser(data: {
    uid: string
    email: string | null
    telegram_account: string | null
    discord_account: string | null
}, client?: PoolClient)
```
- SQL: `INSERT INTO fam_users (...) VALUES (...) ON CONFLICT (uid) DO UPDATE SET ...`
- Sử dụng `EXCLUDED` để lấy giá trị mới

#### 1.3 `deleteFamUser()` - Xóa theo uid
```typescript
deleteFamUser(uid: string, client?: PoolClient)
```
- SQL: `DELETE FROM fam_users WHERE uid = $1`

#### 1.4 Thêm constant mới
```typescript
const FAM_USER_SAFE_SQL = `
  uid, email, telegram_account, discord_account, created_at
`;
```

---

### Bước 2: Thêm service methods cho Fam Users

**File:** `src/services/user.service.ts`

#### 2.1 `getFamUsers()`
```typescript
async getFamUsers(params: {
    uid?: string
    page?: number
    limit?: number
})
```
- Wrapper đơn giản cho `userRepository.getFamUsers()`

#### 2.2 `importFamUsers()`
```typescript
async importFamUsers(rows: Record<string, string>[])
```
- Duyệt qua từng row trong CSV
- Trích xuất: `uid`, `email`, `telegram_account`, `discord_account`
- Trim whitespace ở các trường
- Bỏ qua row nếu `uid` trống
- Dùng `withTransaction` để batch insert
- Trả về: `{ inserted: number, skipped: number, updated: number }`

---

### Bước 3: Tạo API Endpoint - List Fam Users

**File:** `src/app/api/admin/fam-users/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"
import { userService } from "@/services/user.service"

export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        const url = new URL(req.url)
        const uid = url.searchParams.get("uid") || ""
        const page = parseInt(url.searchParams.get("page") || "1")
        const limit = parseInt(url.searchParams.get("limit") || "10")

        const result = await userService.getFamUsers({ uid, page, limit })
        return NextResponse.json(result)
    } catch (e) {
        console.error("[fam-users]", e)
        return NextResponse.json({ error: "Lấy danh sách thất bại" }, { status: 500 })
    }
}
```

---

### Bước 4: Tạo API Endpoint - Import CSV

**File:** `src/app/api/admin/fam-users/import/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"
import { userService } from "@/services/user.service"

export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        const body = await req.json()
        const { rows } = body as { rows: Record<string, string>[] }

        if (!rows?.length) {
            return NextResponse.json(
                { error: "Thiếu dữ liệu" },
                { status: 400 }
            )
        }

        const result = await userService.importFamUsers(rows)
        return NextResponse.json(result)
    } catch (e) {
        console.error("[fam-users-import]", e)
        return NextResponse.json({ error: "Import thất bại" }, { status: 500 })
    }
}
```

---

### Bước 5: Tạo API Endpoint - Delete Fam User

**File:** `src/app/api/admin/fam-users/[uid]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"
import { userService } from "@/services/user.service"

export async function DELETE(
    req: NextRequest,
    { params }: { params: { uid: string } }
) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        await userService.deleteFamUser(params.uid)
        return NextResponse.json({ message: "Xóa thành công" })
    } catch (e) {
        console.error("[fam-users-delete]", e)
        return NextResponse.json({ error: "Xóa thất bại" }, { status: 500 })
    }
}
```

---

### Bước 6: Tạo Component - FamUsersTab

**File:** `src/components/FamUsersTab.tsx`

Component tương tự `ImportVolumeTab` và `UserManagementTable`:

#### UI Structure:
```
┌─────────────────────────────────────┐
│  🔍 Search: [________]              │
│  📥 Import CSV  (tùy chọn)          │
├─────────────────────────────────────┤
│  STT | UID | Email | Telegram      │
│   1  | ...  | ...   | ...          │
│   2  | ...  | ...   | ...          │
├─────────────────────────────────────┤
│  ← Trước  1 2 3 4 5  Sau →         │
└─────────────────────────────────────┘
```

#### State:
```typescript
const [users, setUsers] = useState<FamUser[]>([])
const [loading, setLoading] = useState(false)
const [searchUid, setSearchUid] = useState("")
const [page, setPage] = useState(1)
const [total, setTotal] = useState(0)
const [showImport, setShowImport] = useState(false)
const [importResult, setImportResult] = useState<{ inserted: number, skipped: number } | null>(null)
const fileRef = useRef<HTMLInputElement>(null)
```

#### Functions:
- `loadFamUsers()` - Fetch từ `/api/admin/fam-users?uid=&page=&limit=`
- `handleSearch()` - Fetch với search term
- `handleImport()` - Parse CSV bằng PapaParse, POST lên `/api/admin/fam-users/import`
- `handleDelete(uid)` - DELETE `/api/admin/fam-users/[uid]`, confirm dialog
- `useEffect(() => { loadFamUsers() }, [])` - Load lần đầu

#### Styling:
- Theo pattern nhất quán với các admin table component khác
- `bg-white rounded-2xl shadow-sm` cho containers
- `space-y-3` cho outer container spacing
- Input: `rounded-xl border border-gray-200 px-4 py-2.5 text-sm`
- Buttons: `rounded-xl py-2.5 text-sm font-semibold`

---

### Bước 7: Cập nhật Admin Page

**File:** `src/app/admin/page.tsx`

#### Thêm tab mới:
```typescript
type TabId = "redeem" | "users" | "stats" | "import" | "fam-users"

const TABS: Tab[] = [
    { id: "redeem", label: "Duyệt quà", icon: "🎁" },
    { id: "users", label: "Quản lý User", icon: "👤" },
    { id: "stats", label: "Danh sách đổi quà", icon: "📊" },
    { id: "import", label: "Import Volume CSV", icon: "📥" },
    { id: "fam-users", label: "Fam Users", icon: "👥" },
]
```

#### Thêm import:
```typescript
import FamUsersTab from "@/components/FamUsersTab"
```

#### Thêm render:
```typescript
{activeTab === "fam-users" && (
    <div className="bg-white rounded-2xl shadow-sm p-4">
        <FamUsersTab />
    </div>
)}
```

---

## Tổng kết các file cần thay đổi

| # | File | Action | Mô tả |
|---|------|--------|-------|
| 1 | `src/lib/repository.ts` | Edit | Thêm 3 methods: getFamUsers, upsertFamUser, deleteFamUser |
| 2 | `src/services/user.service.ts` | Edit | Thêm 2 methods: getFamUsers, importFamUsers |
| 3 | `src/app/api/admin/fam-users/route.ts` | New | GET - List fam users |
| 4 | `src/app/api/admin/fam-users/import/route.ts` | New | POST - Import CSV |
| 5 | `src/app/api/admin/fam-users/[uid]/route.ts` | New | DELETE - Xóa fam user |
| 6 | `src/components/FamUsersTab.tsx` | New | UI Component |
| 7 | `src/app/admin/page.tsx` | Edit | Thêm tab "Fam Users" |

---

## CSV Format

File CSV có delimiter là `;`:

```
email;uid;telegram_account;discord_account
tiendung3998@gmail.com;31732711;Zeus Nguyen;pandazeusd
letranthanhduy2000@gmail.com;31123853;duy le;duy1111
```

PapaParse config:
```javascript
Papa.parse(file, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    complete: (parsed) => { /* xử lý */ }
})
```

---

## Flow Diagram

```mermaid
graph TD
    A[Admin mở tab Fam Users] --> B[Load danh sách từ API]
    B --> C{Thao tác?}
    C -->|Import CSV| D[Chọn file CSV]
    D --> E[PapaParse parse]
    E --> F[POST /api/admin/fam-users/import]
    F --> G[Loop qua từng row]
    G --> H{uid tồn tại?}
    H -->|Có| I[UPDATE row]
    H -->|Không| J[INSERT mới]
    I --> K{Còn row?}
    J --> K
    K -->|Còn| G
    K -->|Hết| L[Trả về kết quả]
    L --> M[Hiển thị kết quả]
    
    C -->|Delete| N[DELETE /api/admin/fam-users/[uid]]
    N --> O[Xóa khỏi DB]
    O --> P[Reload danh sách]
    
    C -->|Search| Q[Search theo uid]
    Q --> R[Hiển thị kết quả]
```

---

## Error Handling

1. **Unauthorized**: Trả về 401 nếu không phải admin
2. **Thiếu dữ liệu**: Trả về 400 nếu rows rỗng
3. **Lỗi parse CSV**: Thông báo "Không thể đọc file CSV"
4. **Lỗi server**: Thông báo "Import thất bại" + log console
5. **UID trống**: Bỏ qua row đó (skip)
6. **Duplicate UID**: Tự động handle bằng ON CONFLICT
