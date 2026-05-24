"use client"

import { useEffect, useState } from "react"
import {deleteUser, getUsers, updateUser, createUser} from "@/app/services/admin"

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

    const [newUser, setNewUser] =
        useState({
            uid: "",
            name: "",
            telegram_id: "",
            password: "",
        })

    const limit = 10

    async function loadUsers() {
        const data = await getUsers(uid, page, limit)
        setUsers(data.items)
        setTotal(data.total)
    }

    useEffect(() => {
        loadUsers()
    }, [page])

    async function handleSearch() {
        setPage(1)

        const data = await getUsers(uid,1, limit)

        setUsers(data.items)
        setTotal(data.total)
    }

    async function handleDelete(id: string) {
        const ok = confirm("Xóa user này?")

        if (!ok) return
        await deleteUser(id)
        await loadUsers()
    }

    async function handleEdit(user: User) {
        const name =
            prompt(
                "Tên user",
                user.name
            ) || user.name

        await updateUser(user.id, {
            ...user,
            name,
        })

        await loadUsers()
    }

    async function handleCreateUser() {
        try {
            await createUser({
                uid: newUser.uid,
                name: newUser.name,
                telegram_id: Number(newUser.telegram_id),
                password:
                newUser.password,
            })
            setShowCreate(false)
            setNewUser({uid: "", name: "", telegram_id: "", password: "",})

            await loadUsers()
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Create failed"
            )
        }
    }

    const totalPages = Math.max(
        1,
        Math.ceil(total / limit)
    )

    return (
        <div className="space-y-1">
            {/* SEARCH */}
            <div className="flex gap-2">
                <input
                    value={uid}
                    onChange={(e) =>
                        setUid(e.target.value)
                    }
                    placeholder="Tìm theo UID..."
                    className=" flex-1 h-9 px-3 rounded-xl border border-gray-200 text-[12px] outline-none focus:border-blue-400"/>
                <button
                    onClick={handleSearch}
                    className="h-9 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-medium transition">
                    Tìm
                </button>
                <button
                    onClick={() =>setShowCreate(true)}
                    className="h-9 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white text-[12px] font-medium transition">
                    + Thêm user
                </button>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                    <thead className="border-b bg-gray-50">
                    <tr className="text-gray-500">
                        <th className="text-left px-2 py-1.5 font-medium">
                            UID
                        </th>

                        <th className="text-left px-2 py-1.5 font-medium">
                            Tên
                        </th>

                        <th className="text-left px-2 py-1.5 font-medium">
                            Telegram
                        </th>

                        <th className="text-left px-2 py-1.5 font-medium">
                            Điểm
                        </th>

                        <th className="text-left px-2 py-1.5 font-medium">
                            Role
                        </th>

                        <th className="text-right px-2 py-1.5 font-medium">
                            Thao tác
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {users.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="text-center py-6 text-gray-400 text-[12px]"
                            >
                                Không có user
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr
                                key={user.id}
                                className="border-b last:border-0 hover:bg-gray-50 transition"
                            >
                                <td className="px-2 py-1.5 font-medium text-gray-700">
                                    {user.uid}
                                </td>

                                <td className="px-2 py-1.5 text-gray-600">
                                    {user.name || "-"}
                                </td>

                                <td className="px-2 py-1.5 text-gray-600">
                                    {user.telegram_id}
                                </td>

                                <td className="px-2 py-1.5">
                                <span className="font-medium text-blue-600">
                                    {user.available_point}
                                </span>
                                </td>

                                <td className="px-2 py-1.5">
                                <span
                                    className={`
                                        px-1.5 py-0.5 rounded-md text-[10px] font-medium
                                        ${
                                        user.role === "admin"
                                            ? "bg-red-50 text-red-600"
                                            : "bg-gray-100 text-gray-600"
                                    }
                                    `}
                                >
                                    {user.role}
                                </span>
                                </td>

                                <td className="px-2 py-1.5">
                                    <div className="flex justify-end gap-1.5">
                                        <button
                                            onClick={() =>
                                                handleEdit(user)
                                            }
                                            className="
                                            px-2 py-1
                                            rounded-lg
                                            bg-blue-50
                                            text-blue-600
                                            hover:bg-blue-100
                                            text-[10px]
                                            font-medium
                                            transition
                                        "
                                        >
                                            Sửa
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(user.id)
                                            }
                                            className="
                                            px-2 py-1
                                            rounded-lg
                                            bg-red-50
                                            text-red-600
                                            hover:bg-red-100
                                            text-[10px]
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
            <div className="flex items-center justify-between pt-1">
                <button
                    onClick={() =>
                        setPage((prev) =>
                            Math.max(prev - 1, 1)
                        )
                    }
                    disabled={page === 1}
                    className={`
                    px-3 py-1.5 rounded-lg text-[12px] font-medium transition
                    ${
                        page === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                    }
                `}
                >
                    ←
                </button>

                <span className="text-[12px] text-gray-500 font-medium">
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
                    disabled={page >= totalPages}
                    className={`
                    px-3 py-1.5 rounded-lg text-[12px] font-medium transition
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
            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-4 w-full max-w-sm">
                        <h2 className="text-sm font-semibold mb-4">
                            Thêm user
                        </h2>

                        <div className="space-y-3">
                            <input
                                placeholder="UID"
                                value={newUser.uid}
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        uid: e.target.value,
                                    })
                                }
                                className="w-full h-10 border rounded-xl px-3 text-[12px]"
                            />

                            <input
                                placeholder="Tên"
                                value={newUser.name}
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full h-10 border rounded-xl px-3 text-[12px]"
                            />

                            <input
                                placeholder="Telegram ID"
                                value={
                                    newUser.telegram_id
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        telegram_id:
                                        e.target
                                            .value,
                                    })
                                }
                                className="w-full h-10 border rounded-xl px-3 text-[12px]"
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={
                                    newUser.password
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        password:
                                        e.target
                                            .value,
                                    })
                                }
                                className="w-full h-10 border rounded-xl px-3 text-[12px]"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowCreate(false)}
                                className=" px-4 py-2 rounded-xl bg-gray-100 text-[12px]">
                                Hủy
                            </button>

                            <button
                                onClick={handleCreateUser}
                                className="px-4 py-2 rounded-xl bg-blue-500 text-white text-[12px]">
                                Tạo user
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}