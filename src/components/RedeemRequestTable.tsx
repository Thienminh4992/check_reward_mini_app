"use client"

import { useEffect, useState } from "react"

import {
    RedeemRequest,
    approveRedeemRequest,
    rejectRedeemRequest,
    getRedeemRequests,
} from "@/app/services/admin"

export default function RedeemRequestTable() {

    // =========================
    // DATA
    // =========================
    const [items, setItems] = useState<
        RedeemRequest[]
    >([])

    const [loading, setLoading] =
        useState(true)

    // =========================
    // FILTER
    // =========================
    const [status, setStatus] = useState<
        "all" |
        "pending" |
        "approved" |
        "rejected"
    >("all")

    // =========================
    // PAGINATION
    // =========================
    const [page, setPage] = useState(1)

    const [total, setTotal] = useState(0)

    const limit = 10

    const totalPages = Math.max(
        1,
        Math.ceil(total / limit)
    )

    // =========================
    // MODAL STATE
    // =========================
    const [approveId, setApproveId] =
        useState<string | null>(null)

    const [rejectId, setRejectId] =
        useState<string | null>(null)

    const [rejectReason, setRejectReason] =
        useState("")

    const [submitting, setSubmitting] =
        useState(false)

    const [selectedUser, setSelectedUser] =
        useState<RedeemRequest | null>(null)

    // =========================
    // LOAD DATA
    // =========================
    const loadData = async () => {
        try {
            setLoading(true)

            const res =
                await getRedeemRequests(
                    status,
                    page,
                    limit
                )

            setItems(res.items ?? [])
            setTotal(res.total ?? 0)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        async function fetchData() {
            await loadData()
        }

        fetchData()
    }, [page, status])

    // =========================
    // APPROVE
    // =========================
    const handleApprove = async () => {
        if (!approveId) return

        try {
            setSubmitting(true)

            await approveRedeemRequest(approveId)

            setApproveId(null)

            await loadData()
        } catch (error) {
            console.error(error)
            alert("Approve failed")
        } finally {
            setSubmitting(false)
        }
    }

    // =========================
    // REJECT
    // =========================
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

            await loadData()
        } catch (error) {
            console.error(error)
            alert("Reject failed")
        } finally {
            setSubmitting(false)
        }
    }

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-500">
                Đang tải dữ liệu...
            </div>
        )
    }

    // =========================
    // FILTER TABS
    // =========================
    const tabs = [
        { id: "all",      label: "Tất cả" },
        { id: "pending",  label: "Chờ duyệt" },
        { id: "approved", label: "Đã duyệt" },
        { id: "rejected", label: "Đã từ chối" },
    ] as const

    return (
        <>
            {/* FILTER */}
            <div className="bg-white rounded-2xl p-3 shadow-sm mb-3">
                <div className="flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => {
                        const active = status === tab.id

                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setStatus(tab.id)
                                    setPage(1)
                                }}
                                className={`
                                    px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition
                                    ${active
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }
                                `}
                            >
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* EMPTY */}
            {!items || items.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-800 text-lg font-semibold">
                    KHÔNG CÓ YÊU CẦU ĐỔI QUÀ
                </div>
            ) : (
                <div className="">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition px-4 py-3 flex items-center gap-3"
                        >
                            {/* CỘT 1: Tên + món đổi */}
                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={() => setSelectedUser(item)}
                                    className="font-semibold text-gray-800 text-sm hover:text-blue-600 transition text-left leading-tight truncate w-full block"
                                >
                                    {item.name}
                                </button>

                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    Đổi {item.quantity} {item.reward_name}
                                </p>
                            </div>

                            {/* CỘT 2: Badge status */}
                            <div className="flex-shrink-0">
                                <span
                                    className={`
                                        inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap
                                        ${item.status === "pending"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : item.status === "approved"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    }
                                    `}
                                >
                                    {item.status === "pending"
                                        ? "Chờ duyệt"
                                        : item.status === "approved"
                                            ? "Đã duyệt"
                                            : "Từ chối"}
                                </span>
                            </div>

                            {/* CỘT 3: Action buttons (chỉ hiện khi pending) */}
                            <div className="flex-shrink-0 w-[100px] flex justify-end">
                                {item.status === "pending" && (
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setApproveId(item.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                                        >
                                            Duyệt
                                        </button>

                                        <button
                                            onClick={() => setRejectId(item.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PAGINATION */}
            <div className="bg-white rounded-2xl p-3 shadow-sm mt-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() =>
                            setPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={page === 1}
                        className={`
                            px-4 py-2 rounded-xl text-sm font-medium transition
                            ${page === 1
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
                            setPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        disabled={page >= totalPages}
                        className={`
                            px-4 py-2 rounded-xl text-sm font-medium transition
                            ${page >= totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }
                        `}
                    >
                        Sau →
                    </button>
                </div>
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

                        <div className="space-y-2 text-sm">
                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                                <span className="font-medium text-gray-700">Gmail:</span>{" "}
                                <span className="text-gray-800 break-all">
                                    {selectedUser.email || "Chưa cập nhật"}
                                </span>
                            </div>

                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                                <span className="font-medium text-gray-700">SĐT:</span>{" "}
                                <span className="text-gray-800">
                                    {selectedUser.phone_number || "Chưa cập nhật"}
                                </span>
                            </div>

                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                                <span className="font-medium text-gray-700">Địa chỉ:</span>{" "}
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
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
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
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
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