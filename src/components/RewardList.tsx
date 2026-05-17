"use client"

import { useState } from "react"
import { Reward } from "@/types/reward"
import { redeemReward } from "@/app/services/redeem"
import { useUser } from "@/context/UserContext"

interface ShippingInfo {
    name: string
    phone: string
    address: string
}

interface RewardListProps {
    rewards: Reward[]
    onReload?: () => Promise<void>
}

export default function RewardList({
                                       rewards,
                                       onReload
                                   }: RewardListProps) {
    const { user, setUser } = useUser()

    const userPoints = user?.available_point ?? 0

    const sortedRewards = [...rewards].sort(
        (a, b) => a.required_points - b.required_points
    )
    const [page, setPage] = useState(0)
    const itemsPerPage = 3
    const totalPages = Math.ceil(sortedRewards.length / itemsPerPage)

    const visibleRewards = sortedRewards.slice(
        page * itemsPerPage,
        page * itemsPerPage + itemsPerPage
    )
    const handleRedeem = async (
        reward: Reward,
        quantity: number,
        shippingInfo: ShippingInfo,
        proofImage: string[]
    ) => {
        try {
            if (!user) return

            await redeemReward({
                user_id: user.id,
                reward_id: reward.id,
                quantity,
                name: reward.name,
                proof_image: proofImage,
                shipping_info: shippingInfo
            })

            const totalPoints = reward.required_points * quantity

            // ✅ fix race condition + cộng dồn đúng
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
            if (error instanceof Error) {
                alert(error.message)
            } else {
                alert("Có lỗi xảy ra")
            }
        }
    }

    if (!user) {
        return <div className="p-4 text-center">Loading user...</div>
    }

    return (
        <div className="mx-3 mt-4">
            {/*<h3 className="bg-white rounded-2xl p-2 text-center text-gray-800 font-semibold">*/}
            {/*    🎁 DANH SÁCH QUÀ*/}
            {/*</h3>*/}
            <div className="bg-white rounded-2xl p-2 text-center text-gray-800 text-lg font-semibold">
                🎁 DANH SÁCH QUÀ TẶNG
            </div>

            <div className="space-y-3 mt-3">
                {visibleRewards.map((reward) => (
                    <RewardItem
                        key={reward.id}
                        reward={reward}
                        userPoints={userPoints}
                        onRedeem={handleRedeem}
                    />
                ))}
            </div>

            {/* Điều hướng */}
            <div className="flex items-center justify-center gap-3 mt-4">
                <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className={`w-8 h-8 rounded-full text-sm ${
                        page === 0
                            ? "bg-gray-200 text-gray-400"
                            : "bg-blue-500 text-white"
                    }`}
                >
                    {"<"}
                </button>

                <span className="text-sm text-gray-500">
                    {page + 1}/{totalPages}
                </span>

                <button
                    onClick={() =>
                        setPage((prev) =>
                            Math.min(prev + 1, totalPages - 1)
                        )
                    }
                    disabled={page === totalPages - 1}
                    className={`w-8 h-8 rounded-full text-sm ${
                        page === totalPages - 1
                            ? "bg-gray-200 text-gray-400"
                            : "bg-blue-500 text-white"
                    }`}
                >
                    {">"}
                </button>
            </div>
        </div>
    )
}

/* =========================
   🔽 Internal Component (UI giữ nguyên)
========================= */

function RewardItem({
                        reward,
                        userPoints,
                        onRedeem
                    }: {
    reward: Reward
    userPoints: number
    onRedeem: (reward: Reward, quantity: number, shippingInfo: ShippingInfo, proofImage: string[]) => void
}) {
    const [quantity, setQuantity] = useState(1)
    const [showError, setShowError] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [files, setFiles] = useState<File[]>([])

    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
        name: "",
        phone: "",
        address: ""
    })
    const uploadImage = async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData
        })

        const data = await res.json()

        console.log("STATUS:", res.status)
        console.log("UPLOAD RESPONSE:", data) // 👈 cực kỳ quan trọng

        if (!res.ok || !data.url) {
            throw new Error(data.error || "Upload failed")
        }

        return data.url
    }

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
        if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
            alert("Vui lòng nhập đầy đủ thông tin")
            return
        }

        if (files.length !== 2) {
            alert("Vui lòng upload đúng 2 ảnh")
            return
        }

        try {
            // ✅ upload 2 ảnh song song
            const imageUrls = await Promise.all(files.map(uploadImage))
            console.log('imageUrls', imageUrls)

            onRedeem(reward, quantity, shippingInfo, imageUrls)

            setShowForm(false)
        } catch (error) {
            alert("Upload ảnh thất bại")
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

                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 shadow-inner">
                        <button
                            onClick={decrease}
                            disabled={quantity === 1}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                                quantity === 1 ? "text-gray-300" : "hover:bg-gray-200"
                            }`}
                        >
                            -
                        </button>

                        <span className="w-10 text-center font-medium text-sm">
                            {quantity}
                        </span>

                        <button
                            onClick={increase}
                            disabled={quantity === reward.stock}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                                quantity === reward.stock ? "text-gray-300" : "hover:bg-gray-200"
                            }`}
                        >
                            +
                        </button>
                    </div>

                    <button
                        onClick={handleRedeemClick}
                        disabled={reward.stock === 0}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                            reward.stock === 0
                                ? "bg-gray-300 text-white cursor-not-allowed"
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

            {/* Modal form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-[380px] shadow-xl">
                        <h2 className="text-lg font-semibold mb-4">
                            Thông tin nhận quà
                        </h2>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Họ và tên"
                                value={shippingInfo.name}
                                onChange={(e) =>
                                    setShippingInfo({ ...shippingInfo, name: e.target.value })
                                }
                                className="w-full border rounded-xl px-3 py-2"
                            />

                            <input
                                type="text"
                                placeholder="Số điện thoại"
                                value={shippingInfo.phone}
                                onChange={(e) =>
                                    setShippingInfo({ ...shippingInfo, phone: e.target.value })
                                }
                                className="w-full border rounded-xl px-3 py-2"
                            />

                            <textarea
                                placeholder="Địa chỉ nhận"
                                value={shippingInfo.address}
                                onChange={(e) =>
                                    setShippingInfo({ ...shippingInfo, address: e.target.value })
                                }
                                className="w-full border rounded-xl px-3 py-2"
                            />

                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    if (!e.target.files) return
                                    setFiles(Array.from(e.target.files).slice(0, 2))
                                }}
                                className="w-full border rounded-xl px-3 py-2"
                            />
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 rounded-xl bg-gray-200"
                            >
                                Huỷ
                            </button>

                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 rounded-xl bg-blue-500 text-white"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}