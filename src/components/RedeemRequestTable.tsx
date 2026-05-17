"use client"

import { useState } from "react"
import {
    RedeemRequest,
    approveRedeemRequest,
    rejectRedeemRequest,
} from "@/app/services/admin"

interface Props {
    items: RedeemRequest[]
    onApproved: () => void
}

export default function RedeemRequestTable({ items, onApproved }: Props) {
    const [approveId, setApproveId] = useState<string | null>(null)
    const [rejectId, setRejectId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // 👇 thêm state modal user detail
    const [selectedUser, setSelectedUser] = useState<RedeemRequest | null>(null)

    const handleApprove = async () => {
        if (!approveId) return

        try {
            setSubmitting(true)
            await approveRedeemRequest(approveId)
            setApproveId(null)
            onApproved()
        } catch (error) {
            console.error(error)
            alert("Approve failed")
        } finally {
            setSubmitting(false)
        }
    }

    const handleReject = async () => {
        if (!rejectId || !rejectReason.trim()) {
            alert("Vui lòng nhập lý do từ chối")
            return
        }

        try {
            setSubmitting(true)
            await rejectRedeemRequest(rejectId, rejectReason)

            sessionStorage.removeItem("rewards")

            setRejectId(null)
            setRejectReason("")
            onApproved()
        } catch (error) {
            console.error(error)
            alert("Reject failed")
        } finally {
            setSubmitting(false)
        }
    }

    if (!items || items.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-2 text-center text-gray-800 text-lg font-semibold">
                KHÔNG CÓ YÊU CẦU ĐỔI QUÀ
            </div>
        )
    }

    return (
        <>
            <div className="space-y-3">
                <div className="bg-white rounded-2xl p-2 text-center text-gray-800 text-lg font-semibold">
                    DANH SÁCH ĐỔI QUÀ CHỜ DUYỆT
                </div>

                {items.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-4 flex justify-between items-start"
                    >
                        <div className="flex-1 min-w-0">

                            {/* 👇 CLICK NAME */}
                            <button
                                onClick={() => setSelectedUser(item)}
                                className="font-semibold text-gray-800 text-base hover:text-blue-600 transition text-left"
                            >
                                {item.name}
                            </button>

                            <p className="text-sm text-gray-500 mt-1 truncate">
                                Đổi {item.quantity} {item.reward_name}
                            </p>
                        </div>

                        <div className="ml-4 flex flex-col items-end gap-2">
                            {item.status === "pending" && (
                                <div className="flex gap-2 mt-1">
                                    <button
                                        onClick={() => setApproveId(item.id)}
                                        className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                                    >
                                        Duyệt
                                    </button>

                                    <button
                                        onClick={() => setRejectId(item.id)}
                                        className="px-3 py-1 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* USER DETAIL MODAL */}
            {selectedUser && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
                    onClick={() => setSelectedUser(null)}
                >
                    <div
                        className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-end">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-400 hover:text-gray-600 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* HEADER */}
                        <div className="flex flex-col items-center -mt-2 mb-4">
                            <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold shadow">
                                {selectedUser.name?.charAt(0).toUpperCase()}
                            </div>

                            <h2 className="mt-2 text-base font-semibold text-gray-800 text-center">
                                {selectedUser.name}
                            </h2>

                            <p className="text-xs text-gray-400 text-center">
                                Thông tin người đổi quà
                            </p>
                        </div>

                        {/* INFO */}
                        <div className="space-y-2 text-sm">
                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-gray-700">
                        Gmail:
                    </span>{" "}
                                <span className="text-gray-800 break-all">
                        {selectedUser.email || "Chưa cập nhật"}
                    </span>
                            </div>

                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-gray-700">
                        SĐT:
                    </span>{" "}
                                <span className="text-gray-800">
                        {selectedUser.phone_number || "Chưa cập nhật"}
                    </span>
                            </div>

                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-gray-700">
                        Địa chỉ:
                    </span>{" "}
                                <span className="text-gray-800">
                        {selectedUser.address || "Chưa cập nhật"}
                    </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* APPROVE MODAL */}
            {approveId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Xác nhận duyệt yêu cầu?
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Yêu cầu sẽ được xác nhận và xử lý.
                            </p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() => setApproveId(null)}
                                className="flex-1 rounded-2xl border border-gray-200 bg-gray-100 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200 active:scale-95"
                            >
                                Huỷ
                            </button>

                            <button
                                onClick={handleApprove}
                                disabled={submitting}
                                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-95 disabled:opacity-60"
                            >
                                {submitting ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT MODAL */}
            {rejectId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Từ chối yêu cầu
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Vui lòng nhập lý do từ chối.
                            </p>
                        </div>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Nhập lý do..."
                            rows={4}
                            className="mt-5 w-full rounded-2xl border border-gray-200 p-4 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setRejectId(null)
                                    setRejectReason("")
                                }}
                                className="flex-1 rounded-2xl border border-gray-200 bg-gray-100 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200 active:scale-95"
                            >
                                Huỷ
                            </button>

                            <button
                                onClick={handleReject}
                                disabled={submitting}
                                className="flex-1 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-95 disabled:opacity-60"
                            >
                                {submitting ? "Đang gửi..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}