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
        try {
            setLoading(true)

            await createUser({
                uid: newUser.uid,
                name: newUser.name,
                telegram_id: Number(
                    newUser.telegram_id
                ),
                password: newUser.password,
            })

            setShowCreate(false)

            setNewUser({
                uid: "",
                name: "",
                telegram_id: "",
                password: "",
            })

            await loadUsers()
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Create failed"
            )
        } finally {
            setLoading(false)
        }
    }

    const totalPages = Math.max(
        1,
        Math.ceil(total / limit)
    )

    return (
        <div className="space-y-2">
            {/* SEARCH */}
            <div className="flex gap-2">
                <input
                    value={uid}
                    onChange={(e) =>
                        setUid(e.target.value)
                    }
                    placeholder="Tìm theo UID..."
                    className="
                        flex-1
                        h-10
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
                    "
                >
                    Tìm
                </button>

                <button
                    onClick={() =>
                        setShowCreate(true)
                    }
                    className="
                        h-10
                        px-4
                        rounded-xl
                        bg-green-500
                        hover:bg-green-600
                        text-white
                        text-sm
                        font-medium
                        transition
                    "
                >
                    + Thêm user
                </button>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
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

            {/* PAGINATION */}
            <div className="flex items-center justify-between pt-2">
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
                    ←
                </button>

                <span className="text-sm text-gray-500 font-medium">
                    {page} / {totalPages}
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
                    →
                </button>
            </div>

            {/* CREATE MODAL */}
            {showCreate && (
                <div
                    className="
            fixed inset-0 z-50
            bg-black/40
            flex items-center justify-center
            p-4
        "
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        className="
                bg-white
                rounded-3xl
                p-5
                w-full
                max-w-md
                max-h-[90vh]
                overflow-y-auto
            "
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold mb-5 text-blue-500 text-center">
                            THÊM USER
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    UID
                                </label>
                                <input
                                    placeholder="UID"
                                    value={newUser.uid}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, uid: e.target.value })
                                    }
                                    className="w-full h-11 border rounded-xl px-4 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Tên
                                </label>
                                <input
                                    placeholder="Tên"
                                    value={newUser.name}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, name: e.target.value })
                                    }
                                    className="w-full h-11 border rounded-xl px-4 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Telegram ID
                                </label>
                                <input
                                    placeholder="Telegram ID"
                                    value={newUser.telegram_id}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, telegram_id: e.target.value })
                                    }
                                    className="w-full h-11 border rounded-xl px-4 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={newUser.password}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, password: e.target.value })
                                    }
                                    className="w-full h-11 border rounded-xl px-4 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="px-4 py-2 rounded-xl bg-gray-100 text-sm"
                            >
                                Hủy
                            </button>

                            <button
                                disabled={loading}
                                onClick={handleCreateUser}
                                className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm disabled:opacity-50"
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
                    className="
                        fixed inset-0 z-50
                        bg-black/40
                        flex items-center justify-center
                        p-4
                    "
                    onClick={() => {
                        setShowEdit(false)
                        setEditUser(null)
                    }}
                >
                    <div
                        className="
                bg-white
                rounded-3xl
                p-5
                w-full
                max-w-md
                max-h-[90vh]
                overflow-y-auto
            "
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold mb-5 text-center text-blue-500">
                            CHỈNH SỬA USER
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    UID
                                </label>
                                <input
                                    placeholder="UID"
                                    value={editUser.uid}
                                    onChange={(e) =>
                                        setEditUser({ ...editUser, uid: e.target.value })
                                    }
                                    className="w-full h-11 border rounded-xl px-4 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Tên
                                </label>
                                <input
                                    placeholder="Tên"
                                    value={editUser.name}
                                    onChange={(e) =>
                                        setEditUser({ ...editUser, name: e.target.value })
                                    }
                                    className="w-full h-11 border rounded-xl px-4 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Telegram ID
                                </label>
                                <input
                                    placeholder="Telegram ID"
                                    value={editUser.telegram_id}
                                    onChange={(e) =>
                                        setEditUser({ ...editUser, telegram_id: e.target.value })
                                    }
                                    className="w-full h-11 border rounded-xl px-4 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Quyền
                                </label>
                                <select
                                    value={editUser.role}
                                    onChange={(e) =>
                                        setEditUser({ ...editUser, role: e.target.value })
                                    }
                                    className="w-full h-11 border rounded-xl px-4 text-sm"
                                >
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                onClick={() => {
                                    setShowEdit(false)
                                    setEditUser(null)
                                }}
                                className="px-4 py-2 rounded-xl bg-gray-100 text-sm"
                            >
                                Hủy
                            </button>

                            <button
                                disabled={loading}
                                onClick={handleUpdateUser}
                                className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm disabled:opacity-50"
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