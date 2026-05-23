"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus } from "lucide-react"
import { Reward } from "@/types/reward"
import { redeemReward } from "@/app/services/redeem"
import { useUser } from "@/context/UserContext"

interface RewardListProps {
    rewards: Reward[]
    redeemedRewardIds: Set<string>
    onReload?: () => Promise<void>
}

// =========================
// Form state cho thêm/sửa
// =========================
interface RewardForm {
    name: string
    description: string
    image_url: string
    required_points: number | ""
    stock: number | ""
}

const EMPTY_FORM: RewardForm = {
    name: "",
    description: "",
    image_url: "",
    required_points: "",
    stock: "",
}

export default function RewardList({
                                       rewards,
                                       redeemedRewardIds,
                                       onReload
                                   }: RewardListProps) {
    const { user, setUser } = useUser()

    const isAdmin = user?.role === "admin"
    const userPoints = user?.available_point ?? 0

    const sortedRewards = useMemo(() => {
        return [...rewards].sort(
            (a, b) => b.required_points - a.required_points
        )
    }, [rewards])

    const [page, setPage] = useState(0)
    const itemsPerPage = 3
    const totalPages = Math.ceil(sortedRewards.length / itemsPerPage)

    const visibleRewards = useMemo(() => {
        return sortedRewards.slice(
            page * itemsPerPage,
            page * itemsPerPage + itemsPerPage
        )
    }, [sortedRewards, page])

    // =========================
    // Admin modal state
    // =========================
    const [showModal, setShowModal] = useState(false)
    const [editingReward, setEditingReward] = useState<Reward | null>(null)
    const [form, setForm] = useState<RewardForm>(EMPTY_FORM)
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string>("")

    const openCreate = () => {
        setEditingReward(null)
        setForm(EMPTY_FORM)
        setPreviewUrl("")
        setShowModal(true)
    }

    const openEdit = (reward: Reward) => {
        setEditingReward(reward)
        setForm({
            name: reward.name,
            description: reward.description ?? "",
            image_url: reward.image_url ?? "",
            required_points: reward.required_points,
            stock: reward.stock,
        })
        setPreviewUrl(reward.image_url ?? "")
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingReward(null)
        setForm(EMPTY_FORM)
        setPreviewUrl("")
    }

    // Upload ảnh → nhận url
    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()

            if (!data.success) throw new Error(data.message)

            setForm(prev => ({ ...prev, image_url: data.url }))
            setPreviewUrl(data.url)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Upload thất bại")
        } finally {
            setUploading(false)
        }
    }

    // Submit thêm hoặc sửa
    const handleSubmit = async () => {
        if (submitting) return

        if (!form.name || form.required_points === "" || form.stock === "") {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc")
            return
        }

        try {
            setSubmitting(true)

            const payload = {
                name: form.name,
                description: form.description || null,
                image_url: form.image_url || null,
                required_points: Number(form.required_points),
                stock: Number(form.stock),
            }

            const url = editingReward
                ? `/api/admin/rewards/${editingReward.id}`
                : "/api/admin/rewards"

            const method = editingReward ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!data.success) throw new Error(data.message)

            alert(editingReward ? "Cập nhật thành công!" : "Thêm quà thành công!")
            closeModal()
            await onReload?.()
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Có lỗi xảy ra")
        } finally {
            setSubmitting(false)
        }
    }

    // Xoá reward
    const handleDelete = useCallback(async (reward: Reward) => {
        if (!confirm(`Xoá "${reward.name}"?`)) return

        try {
            const res = await fetch(`/api/admin/rewards/${reward.id}`, {
                method: "DELETE",
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.message)

            alert("Đã xoá quà tặng")
            await onReload?.()
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Có lỗi xảy ra")
        }
    }, [onReload])

    // =========================
    // User redeem
    // =========================
    const handleRedeem = useCallback(async (
        reward: Reward,
        quantity: number
    ) => {
        try {
            if (!user) return

            await redeemReward({
                user_id: user.id,
                reward_id: reward.id,
                quantity,
                name: reward.name
            })

            const totalPoints = reward.required_points * quantity

            setUser(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    available_point: prev.available_point - totalPoints,
                    redeemed_point: prev.redeemed_point + totalPoints
                }
            })

            sessionStorage.removeItem("rewards")
            alert("Đổi quà thành công!")
            await onReload?.()
        } catch (error: unknown) {
            alert(error instanceof Error ? error.message : "Có lỗi xảy ra")
        }
    }, [user, setUser, onReload])

    if (!user) {
        return <div className="p-4 text-center">Loading user...</div>
    }

    return (
        <div className="mx-3 mt-4">
            {/* Header */}
            <div className="bg-white rounded-2xl p-2 text-center text-gray-800 text-lg font-semibold">
                <h3>🎁 DANH SÁCH QUÀ TẶNG</h3>
                <span className="text-xs text-red-500">
                    Thời gian event: 01/06 - 30/06/2026
                </span>
            </div>

            {/* Nút thêm — chỉ admin */}
            {isAdmin && (
                <button
                    onClick={openCreate}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-blue-400 text-blue-500 text-sm font-medium hover:bg-blue-50 transition"
                >
                    <Plus size={16} />
                    Thêm quà tặng
                </button>
            )}

            {/* Danh sách */}
            <div className="space-y-3 mt-3">
                {visibleRewards.map((reward) => (
                    <RewardItem
                        key={reward.id}
                        reward={reward}
                        userPoints={userPoints}
                        isRedeemed={redeemedRewardIds.has(reward.id)}
                        isAdmin={isAdmin}
                        onRedeem={handleRedeem}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Phân trang */}
            <div className="flex items-center justify-center gap-3 mt-4">
                <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                        page === 0
                            ? "bg-gray-200 text-gray-400"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                >
                    <ChevronLeft size={18} />
                </button>

                <span className="text-sm font-medium text-gray-500">
                    {page + 1}/{totalPages}
                </span>

                <button
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
                    disabled={page === totalPages - 1}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                        page === totalPages - 1
                            ? "bg-gray-200 text-gray-400"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Modal thêm/sửa — chỉ admin */}
            {isAdmin && showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-800 text-center mb-5">
                            {editingReward ? "✏️ Sửa quà tặng" : "➕ Thêm quà tặng"}
                        </h2>

                        <div className="space-y-3">
                            {/* Tên */}
                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Tên quà <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="VD: Voucher Shopee 50k"
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Mô tả
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Mô tả ngắn về quà tặng..."
                                    rows={2}
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                />
                            </div>

                            {/* Điểm & Số lượng */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-600">
                                        Điểm yêu cầu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.required_points}
                                        onChange={e => setForm(prev => ({ ...prev, required_points: e.target.value === "" ? "" : Number(e.target.value) }))}
                                        placeholder="500"
                                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-600">
                                        Số lượng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.stock}
                                        onChange={e => setForm(prev => ({ ...prev, stock: e.target.value === "" ? "" : Number(e.target.value) }))}
                                        placeholder="10"
                                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Upload ảnh */}
                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Ảnh quà tặng
                                </label>

                                <label className="mt-1 flex items-center justify-center gap-2 w-full py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm cursor-pointer hover:border-blue-400 hover:text-blue-500 transition">
                                    {uploading ? "Đang upload..." : "Chọn ảnh (jpg, png, webp — tối đa 2MB)"}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </label>

                                {/* Preview */}
                                {previewUrl && (
                                    <div className="mt-2 flex justify-center">
                                        <img
                                            src={previewUrl}
                                            alt="preview"
                                            className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 rounded-2xl border border-gray-200 bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition active:scale-95"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || uploading}
                                className={`flex-1 rounded-2xl py-3 text-sm font-semibold text-white shadow-md transition active:scale-95 ${
                                    submitting || uploading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg"
                                }`}
                            >
                                {submitting ? "Đang lưu..." : editingReward ? "Cập nhật" : "Thêm mới"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* =========================
   🔽 Internal Component
========================= */

const RewardItem = memo(function RewardItem({
                                                reward,
                                                userPoints,
                                                isRedeemed,
                                                isAdmin,
                                                onRedeem,
                                                onEdit,
                                                onDelete,
                                            }: {
    reward: Reward
    userPoints: number
    isRedeemed: boolean
    isAdmin: boolean
    onRedeem: (reward: Reward, quantity: number) => void
    onEdit: (reward: Reward) => void
    onDelete: (reward: Reward) => void
}) {
    const [quantity, setQuantity] = useState(1)
    const [showError, setShowError] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const totalPoints = reward.required_points * quantity

    const increase = () => {
        if (quantity < reward.stock) setQuantity(q => q + 1)
    }

    const decrease = () => {
        if (quantity > 1) setQuantity(q => q - 1)
    }

    const handleRedeemClick = () => {
        if (reward.stock < quantity || userPoints < totalPoints) {
            setShowError(true)
            return
        }
        setShowForm(true)
    }

    const handleSubmit = async () => {
        if (isSubmitting) return
        try {
            setIsSubmitting(true)
            await onRedeem(reward, quantity)
            setShowForm(false)
        } catch {
            alert("Có lỗi xảy ra")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-4 flex flex-col">
                <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base">
                            {reward.name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {reward.description}
                        </p>

                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <span className="text-blue-600 font-semibold text-sm">
                                {reward.required_points} điểm
                            </span>
                            <span className="text-gray-400 text-xs">
                                Còn {reward.stock}
                            </span>
                        </div>
                    </div>

                    <div className="w-[96px] aspect-square rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                            src={reward.image_url}
                            alt={reward.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Admin actions */}
                {isAdmin && (
                    <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                        <button
                            onClick={() => onEdit(reward)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition"
                        >
                            <Pencil size={13} />
                            Sửa
                        </button>
                        <button
                            onClick={() => onDelete(reward)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition"
                        >
                            <Trash2 size={13} />
                            Xoá
                        </button>
                    </div>
                )}

                <div className="mt-2 flex gap-2 border-t border-gray-100 pt-3">
                    {/* Tăng giảm số lượng */}
                    <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl py-1.5 gap-1">
                        <button
                            onClick={decrease}
                            disabled={true}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-xs text-gray-400"
                        >
                            -
                        </button>
                        <span className="w-6 text-center text-xs font-medium text-gray-700">
            {quantity}
        </span>
                        <button
                            onClick={increase}
                            disabled={true}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-xs text-gray-400"
                        >
                            +
                        </button>
                    </div>

                    {/* Đổi quà */}
                    <button
                        onClick={handleRedeemClick}
                        disabled={reward.stock === 0 || isRedeemed}
                        title={isRedeemed ? "Quà đã được đổi, không thể đổi lần 2" : undefined}
                        className={`flex-1 flex items-center justify-center py-1.5 rounded-xl text-xs font-medium transition ${
                            reward.stock === 0 || isRedeemed
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md active:scale-95"
                        }`}
                    >
                        {reward.stock === 0 ? "Hết hàng" : "Đổi ngay"}
                    </button>
                </div>
            </div>

            {/* Modal lỗi */}
            {showError && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-[320px] shadow-xl text-center">
                        <h2 className="text-lg font-semibold text-red-500 mb-2">
                            Không đủ điểm
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Bạn cần <b>{totalPoints}</b> điểm nhưng hiện chỉ có <b>{userPoints}</b> điểm.
                        </p>
                        <button
                            onClick={() => setShowError(false)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* Modal xác nhận đổi quà */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="w-full max-w-[380px] rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Xác nhận đổi quà
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Bạn có chắc muốn đổi phần quà này không?
                            </p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 rounded-2xl border border-gray-200 bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition active:scale-95"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`flex-1 rounded-2xl py-3 text-sm font-semibold text-white shadow-md transition ${
                                    isSubmitting
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg active:scale-95"
                                }`}
                            >
                                {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
})