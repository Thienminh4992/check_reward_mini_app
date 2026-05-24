"use client"

import { useEffect, useState } from "react"

import { getApprovedRedeemStats } from "@/app/services/admin"

interface Item {
    id: string

    uid: string
    name: string

    email: string
    phone_number: string

    reward_name: string
    required_points: number

    quantity: number

    created_at: string
}

export default function ApprovedRedeemStatsTable() {
    const [items, setItems] =
        useState<Item[]>([])

    const [page, setPage] =
        useState(1)

    const [total, setTotal] =
        useState(0)

    const limit = 10

    async function loadData() {
        const data =
            await getApprovedRedeemStats(
                page,
                limit
            )

        setItems(data.items)

        setTotal(data.total)
    }

    useEffect(() => {
        loadData()
    }, [page])

    const totalPages = Math.max(
        1,
        Math.ceil(total / limit)
    )

    return (
        <div className="space-y-2">
            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                        <thead className="bg-gray-50 border-b">
                        <tr className="text-gray-500">
                            <th className="text-left px-3 py-2.5 font-medium">
                                UID
                            </th>

                            <th className="text-left px-3 py-2.5 font-medium">
                                Người dùng
                            </th>

                            <th className="text-left px-3 py-2.5 font-medium">
                                Email
                            </th>

                            <th className="text-left px-3 py-2.5 font-medium">
                                SĐT
                            </th>

                            <th className="text-left px-3 py-2.5 font-medium">
                                Quà
                            </th>

                            <th className="text-left px-3 py-2.5 font-medium">
                                SL
                            </th>

                            <th className="text-left px-3 py-2.5 font-medium">
                                Điểm
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {items.length ===
                        0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        7
                                    }
                                    className="text-center py-10 text-gray-400 text-[12px]"
                                >
                                    Chưa có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            items.map(
                                (
                                    item
                                ) => (
                                    <tr
                                        key={
                                            item.id
                                        }
                                        className="border-b last:border-0 hover:bg-gray-50 transition"
                                    >
                                        <td className="px-3 py-2.5 font-medium text-gray-700">
                                            {
                                                item.uid
                                            }
                                        </td>

                                        <td className="px-3 py-2.5 text-gray-600">
                                            {
                                                item.name
                                            }
                                        </td>

                                        <td className="px-3 py-2.5 text-gray-600">
                                            {
                                                item.email
                                            }
                                        </td>

                                        <td className="px-3 py-2.5 text-gray-600">
                                            {item.phone_number ||
                                                "-"}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <div className="font-medium text-gray-700">
                                                {
                                                    item.reward_name
                                                }
                                            </div>
                                        </td>

                                        <td className="px-3 py-2.5">
                                            {
                                                item.quantity
                                            }
                                        </td>

                                        <td className="px-3 py-2.5">
                                                <span className="font-semibold text-blue-600">
                                                    {item.required_points *
                                                        item.quantity}
                                                </span>
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
                            px-4 py-2 rounded-xl text-[12px] font-medium transition
                            ${
                            page === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                        }
                        `}
                    >
                        ← Trước
                    </button>

                    <span className="text-[12px] text-gray-500 font-medium">
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
                            px-4 py-2 rounded-xl text-[12px] font-medium transition
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