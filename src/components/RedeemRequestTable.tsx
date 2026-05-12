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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
            // ✅ clear rewards cache
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
                            <h3 className="font-semibold text-gray-800 text-base truncate">
                                {item.telegram_name}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1 truncate">
                                Đổi {item.quantity} {item.reward_name}
                            </p>

                            <div className="mt-2 space-y-1 text-xs text-gray-400">
                                <p>📞 {item.shipping_info?.phone}</p>
                                <p className="truncate">📍 {item.shipping_info?.address}</p>
                            </div>

                            {item.proof_image && item.proof_image.length > 0 && (
                                <div className="mt-3 flex gap-2 overflow-x-auto">
                                    {item.proof_image.map((img: string, index: number) => (
                                        <img
                                            key={index}
                                            src={img}
                                            alt={`proof-${index}`}
                                            className="w-16 h-16 rounded-lg object-cover border cursor-pointer hover:opacity-80"
                                            onClick={() => setSelectedImage(img)}
                                        />
                                    ))}
                                </div>
                            )}
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
                                        className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {/* ViEW IMAGE MODAL */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="preview"
                        className="max-w-[90%] max-h-[90%] rounded-xl shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            {/* APPROVE MODAL */}
            {approveId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Xác nhận duyệt yêu cầu?
                        </h2>

                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                onClick={() => setApproveId(null)}
                                className="px-4 py-2 rounded-xl bg-gray-100"
                            >
                                Huỷ
                            </button>

                            <button
                                onClick={handleApprove}
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT MODAL */}
            {rejectId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Nhập lý do từ chối
                        </h2>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Nhập lý do..."
                            className="w-full mt-4 border rounded-xl p-3 outline-none"
                            rows={4}
                        />

                        <div className="mt-4 flex justify-end gap-2 w-full">
                            <button
                                onClick={() => {
                                    setRejectId(null)
                                    setRejectReason("")
                                }}
                                className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                            >
                                Huỷ
                            </button>

                            <button
                                onClick={handleReject}
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
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