import { useEffect, useState } from "react"
import {
    deleteUser,
    getUsers,
    updateUser,
    createUser,
} from "@/app/services/admin"

interface User {
    id: string
    uid: string
    name: string
    role: string
    phone_number: string
    available_point: number
    telegram_id: string
}

export default function UserManagementTable() {
    const [users, setUsers] = useState<User[]>([])
    const [uid, setUid] = useState("")
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    const [showCreate, setShowCreate] =
        useState(false)

    const [showEdit, setShowEdit] =
        useState(false)

    const [loading, setLoading] =
        useState(false)

    const [newUser, setNewUser] =
        useState({
            uid: "",
            name: "",
            telegram_id: "",
            password: "",
        })

    const [editUser, setEditUser] =
        useState<User | null>(null)

    const limit = 10

    async function loadUsers() {
        const data = await getUsers(
            uid,
            page,
            limit
        )

        setUsers(
            data.items.map((u: any) => ({
                ...u,
                telegram_id: String(
                    u.telegram_id
                ),
            }))
        )

        setTotal(data.total)
    }

    useEffect(() => {
        loadUsers()
    }, [page, uid])

    async function handleSearch() {
        setPage(1)
        await loadUsers()
    }

    async function handleDelete(id: string) {
        const ok = confirm("Xóa user này?")

        if (!ok) return

        await deleteUser(id)
        await loadUsers()
    }

    function openEditModal(user: User) {
        setEditUser(user)
        setShowEdit(true)
    }

    async function handleUpdateUser() {
        if (!editUser) return

        try {
            setLoading(true)

            await updateUser(editUser.id, {
                ...editUser,
                telegram_id: Number(
                    editUser.telegram_id
                ),
            })

            setShowEdit(false)
            setEditUser(null)

            await loadUsers()
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Update failed"
            )
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateUser() {
        if (!newUser.uid.trim()) { alert("Vui lòng nhập UID"); return; }
        if (!newUser.name.trim()) { alert("Vui lòng nhập tên"); return; }
        if (!newUser.telegram_id.trim()) { alert("Vui lòng nhập Telegram ID"); return; }
        if (isNaN(Number(newUser.telegram_id))) { alert("Telegram ID phải là số"); return; }
        if (!newUser.password || newUser.password.length < 6) { alert("Mật khẩu tối thiểu 6 ký tự"); return; }

        try {
            setLoading(true)
            await createUser({
                uid: newUser.uid,
                name: newUser.name,
                telegram_id: Number(newUser.telegram_id),
                password: newUser.password,
            })
            setShowCreate(false)
            setNewUser({ uid: "", name: "", telegram_id: "", password: "" })
            await loadUsers()
        } catch (error) {
            alert(error instanceof Error ? error.message : "Create failed")
        } finally {
            setLoading(false)
        }
    }

    const totalPages = Math.max(
        1,
        Math.ceil(total / limit)
    )

    return (
        <div className="space-y-3">
            {/* SEARCH & ACTIONS - Mobile responsive */}
            <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex flex-col gap-2">
                    {/* Search group - input + Tìm button on same row */}
                    <div className="flex gap-2 flex-1 min-w-0">
                        <input
                            value={uid}
                            onChange={(e) =>
                                setUid(e.target.value)
                            }
                            placeholder="Tìm theo UID..."
                            className="
                                flex-1
                                h-10
                                min-w-0
                                sm:min-w-[200px]
                                px-4
                                rounded-xl
                                border
                                border-gray-200
                                text-sm
                                outline-none
                                focus:border-blue-400
                            "
                        />
                        <button
                            onClick={handleSearch}
                            className="
                                h-10
                                px-4
                                rounded-xl
                                bg-blue-500
                                hover:bg-blue-600
                                text-white
                                text-sm
                                font-medium
                                transition
                                whitespace-nowrap
                            "
                        >
                            Tìm
                        </button>
                    </div>

                    {/* Action buttons - separate row below */}
                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                setShowCreate(true)
                            }
                            className="
                                flex-1
                                sm:flex-none
                                h-10
                                px-4
                                rounded-xl
                                bg-green-500
                                hover:bg-green-600
                                text-white
                                text-sm
                                font-medium
                                transition
                                whitespace-nowrap
                            "
                        >
                            Thêm
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                    <tr className="text-gray-500">
                        <th className="text-left px-3 py-3 font-semibold">
                            UID
                        </th>

                        <th className="text-left px-3 py-3 font-semibold">
                            Tên
                        </th>

                        <th className="text-left px-3 py-3 font-semibold">
                            Telegram
                        </th>

                        <th className="text-left px-3 py-3 font-semibold">
                            Điểm
                        </th>

                        <th className="text-left px-3 py-3 font-semibold">
                            Role
                        </th>

                        <th className="text-right px-3 py-3 font-semibold">
                            Thao tác
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {users.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="
                                    text-center
                                    py-8
                                    text-gray-400
                                    text-sm
                                "
                            >
                                Không có user
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr
                                key={user.id}
                                className="
                                    border-b
                                    last:border-0
                                    hover:bg-gray-50
                                    transition
                                "
                            >
                                <td className="px-3 py-3 font-medium text-gray-700">
                                    {user.uid}
                                </td>

                                <td className="px-3 py-3 text-gray-600">
                                    {user.name || "-"}
                                </td>

                                <td className="px-3 py-3 text-gray-600">
                                    {
                                        user.telegram_id
                                    }
                                </td>

                                <td className="px-3 py-3">
                                    <span className="font-semibold text-blue-600">
                                        {
                                            user.available_point
                                        }
                                    </span>
                                </td>

                                <td className="px-3 py-3">
                                    <span
                                        className={`
                                            px-2 py-1 rounded-lg text-sm font-medium
                                            ${
                                            user.role ===
                                            "admin"
                                                ? "bg-red-50 text-red-600"
                                                : "bg-gray-100 text-gray-600"
                                        }
                                        `}
                                    >
                                        {user.role}
                                    </span>
                                </td>

                                <td className="px-3 py-3">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() =>
                                                openEditModal(
                                                    user
                                                )
                                            }
                                            className="
                                                px-3 py-1.5
                                                rounded-xl
                                                bg-blue-50
                                                text-blue-600
                                                hover:bg-blue-100
                                                text-sm
                                                font-medium
                                                transition
                                            "
                                        >
                                            Sửa
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(
                                                    user.id
                                                )
                                            }
                                            className="
                                                px-3 py-1.5
                                                rounded-xl
                                                bg-red-50
                                                text-red-600
                                                hover:bg-red-100
                                                text-sm
                                                font-medium
                                                transition
                                            "
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* PAGINATION */}
            <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() =>
                            setPage((prev) =>
                                Math.max(prev - 1, 1)
                            )
                        }
                        disabled={page === 1}
                        className={`
                            px-4 py-2 rounded-xl text-sm font-medium transition
                            ${
                            page === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }
                        `}
                    >
                        ← Trước
                    </button>

                    <span className="text-sm text-gray-500 font-medium">
                        Trang {page} / {totalPages}
                    </span>

                    <button
                        onClick={() =>
                            setPage((prev) =>
                                Math.min(
                                    prev + 1,
                                    totalPages
                                )
                            )
                        }
                        disabled={
                            page >= totalPages
                        }
                        className={`
                            px-4 py-2 rounded-xl text-sm font-medium transition
                            ${
                            page >= totalPages
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }
                        `}
                    >
                        Sau →
                    </button>
                </div>
            </div>

            {/* CREATE MODAL */}
            {showCreate && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-2xl p-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="text-gray-400 hover:text-gray-600 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <h2 className="text-base font-semibold text-gray-800 text-center mt-2">
                            THÊM USER MỚI
                        </h2>

                        <div className="space-y-3 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    UID
                                </label>
                                <input
                                    placeholder="UID"
                                    value={newUser.uid}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, uid: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên
                                </label>
                                <input
                                    placeholder="Tên"
                                    value={newUser.name}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, name: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telegram ID
                                </label>
                                <input
                                    placeholder="Telegram ID"
                                    value={newUser.telegram_id}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, telegram_id: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu
                                </label>
                                <input
                                    type="password"
                                    placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                                    value={newUser.password}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, password: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 rounded-xl border border-gray-200 bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                            >
                                Hủy
                            </button>

                            <button
                                disabled={loading}
                                onClick={handleCreateUser}
                                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
                            >
                                {loading ? "Đang tạo..." : "Tạo user"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEdit && editUser && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
                    onClick={() => {
                        setShowEdit(false)
                        setEditUser(null)
                    }}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-2xl p-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setShowEdit(false)
                                    setEditUser(null)
                                }}
                                className="text-gray-400 hover:text-gray-600 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <h2 className="text-base font-semibold text-gray-800 text-center mt-2">
                            CHỈNH SỬA USER
                        </h2>

                        <div className="space-y-3 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    UID
                                </label>
                                <input
                                    placeholder="UID"
                                    value={editUser.uid}
                                    disabled
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên
                                </label>
                                <input
                                    placeholder="Tên"
                                    value={editUser.name}
                                    onChange={(e) =>
                                        setEditUser({ ...editUser, name: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telegram ID
                                </label>
                                <input
                                    placeholder="Telegram ID"
                                    value={editUser.telegram_id}
                                    onChange={(e) =>
                                        setEditUser({ ...editUser, telegram_id: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quyền
                                </label>
                                <select
                                    value={editUser.role}
                                    onChange={(e) => {
                                        if (e.target.value === "admin" && editUser.role !== "admin") {
                                            if (!confirm(`Cảnh báo: Nâng quyền "${editUser.name}" thành admin.`)) return;
                                        }
                                        setEditUser({ ...editUser, role: e.target.value });
                                    }}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                                >
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <button
                                onClick={() => {
                                    setShowEdit(false)
                                    setEditUser(null)
                                }}
                                className="flex-1 rounded-xl border border-gray-200 bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                            >
                                Hủy
                            </button>

                            <button
                                disabled={loading}
                                onClick={handleUpdateUser}
                                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
                            >
                                {loading ? "Đang lưu..." : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}