"use client"

import { useEffect, useState } from "react"
import {deleteUser, getUsers, updateUser} from "@/app/services/admin"

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

    const limit = 10

    async function loadUsers() {
        const data = await getUsers(
            uid,
            page,
            limit
        )

        setUsers(data.items)
        setTotal(data.total)
    }

    useEffect(() => {
        loadUsers()
    }, [page])

    async function handleSearch() {
        setPage(1)

        const data = await getUsers(
            uid,
            1,
            limit
        )

        setUsers(data.items)
        setTotal(data.total)
    }

    async function handleDelete(id: string) {
        const ok = confirm(
            "Xóa user này?"
        )

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

    const totalPages = Math.max(
        1,
        Math.ceil(total / limit)
    )

    return (
        <div className="space-y-2">
            {/* SEARCH */}
            <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex gap-2">
                    <input
                        value={uid}
                        onChange={(e) =>
                            setUid(
                                e.target.value
                            )
                        }
                        placeholder="Tìm theo UID..."
                        className="
                            flex-1
                            h-10
                            px-3
                            rounded-xl
                            border
                            border-gray-200
                            text-[10px]
                            outline-none
                            focus:border-blue-400
                        "
                    />

                    <button
                        onClick={
                            handleSearch
                        }
                        className="
                            h-10
                            px-4
                            rounded-xl
                            bg-blue-500
                            hover:bg-blue-600
                            text-white
                            text-[10px]
                            font-medium
                            transition
                        "
                    >
                        Tìm
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                        <thead className="bg-gray-50 border-b">
                        <tr className="text-gray-500">
                            <th className="text-left px-4 py-3 font-medium">
                                UID
                            </th>

                            <th className="text-left px-4 py-3 font-medium">
                                Tên
                            </th>

                            <th className="text-left px-4 py-3 font-medium">
                                Telegram
                            </th>

                            <th className="text-left px-4 py-3 font-medium">
                                Điểm
                            </th>

                            <th className="text-left px-4 py-3 font-medium">
                                Role
                            </th>

                            <th className="text-right px-4 py-3 font-medium">
                                Thao tác
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {users.length ===
                        0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        6
                                    }
                                    className="text-center py-10 text-gray-400 text-[10px]"
                                >
                                    Không có user
                                </td>
                            </tr>
                        ) : (
                            users.map(
                                (
                                    user
                                ) => (
                                    <tr
                                        key={
                                            user.id
                                        }
                                        className="border-b last:border-0 hover:bg-gray-50 transition"
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-700">
                                            {
                                                user.uid
                                            }
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {user.name ||
                                                "-"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {
                                                user.telegram_id
                                            }
                                        </td>

                                        <td className="px-4 py-3">
                                                <span className="font-medium text-blue-600">
                                                    {
                                                        user.available_point
                                                    }
                                                </span>
                                        </td>

                                        <td className="px-4 py-3">
                                                <span
                                                    className={`
                                                    px-2 py-1 rounded-lg text-[10px] font-medium
                                                    ${
                                                        user.role ===
                                                        "admin"
                                                            ? "bg-red-50 text-red-600"
                                                            : "bg-gray-100 text-gray-600"
                                                    }
                                                `}
                                                >
                                                    {
                                                        user.role
                                                    }
                                                </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(
                                                            user
                                                        )
                                                    }
                                                    className="
                                                            px-2 py-1.5
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
                                                        handleDelete(
                                                            user.id
                                                        )
                                                    }
                                                    className="
                                                            px-2 py-1.5
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
                                )
                            )
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
                            setPage(
                                (
                                    prev
                                ) =>
                                    Math.max(
                                        prev -
                                        1,
                                        1
                                    )
                            )
                        }
                        disabled={
                            page === 1
                        }
                        className={`
                            px-4 py-2 rounded-xl text-[10px] font-medium transition
                            ${
                            page === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                        }
                        `}
                    >
                        ← Trước
                    </button>

                    <span className="text-[10px] text-gray-500 font-medium">
                        Trang {page} /{" "}
                        {totalPages}
                    </span>

                    <button
                        onClick={() =>
                            setPage(
                                (
                                    prev
                                ) =>
                                    Math.min(
                                        prev +
                                        1,
                                        totalPages
                                    )
                            )
                        }
                        disabled={
                            page >=
                            totalPages
                        }
                        className={`
                            px-4 py-2 rounded-xl text-[10px] font-medium transition
                            ${
                            page >=
                            totalPages
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                        }
                        `}
                    >
                        Sau →
                    </button>
                </div>
            </div>
        </div>
    )
}