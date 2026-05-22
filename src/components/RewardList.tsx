"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Reward } from "@/types/reward"
import { redeemReward } from "@/app/services/redeem"
import { useUser } from "@/context/UserContext"

interface RewardListProps {
    rewards: Reward[]
    redeemedRewardIds: Set<string>
    onReload?: () => Promise<void>
}

export default function RewardList({
                                       rewards,
                                       redeemedRewardIds,
                                       onReload
                                   }: RewardListProps) {
    const { user, setUser } = useUser()

    const userPoints = user?.available_point ?? 0

    const sortedRewards = useMemo(() => {
        return [...rewards].sort(
            (a, b) => b.required_points - a.required_points
        )
    }, [rewards])

    const [page, setPage] = useState(0)

    const itemsPerPage = 3

    const totalPages = Math.ceil(
        sortedRewards.length / itemsPerPage
    )

    const visibleRewards = useMemo(() => {
        return sortedRewards.slice(
            page * itemsPerPage,
            page * itemsPerPage + itemsPerPage
        )
    }, [sortedRewards, page])

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

            const totalPoints =
                reward.required_points * quantity

            // ✅ fix race condition
            setUser(prev => {
                if (!prev) return prev

                return {
                    ...prev,
                    available_point:
                        prev.available_point - totalPoints,
                    redeemed_point:
                        prev.redeemed_point + totalPoints
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
    }, [user, setUser, onReload])

    if (!user) {
        return (
            <div className="p-4 text-center">
                Loading user...
            </div>
        )
    }

    return (
        <div className="mx-3 mt-4">
            <div className="bg-white rounded-2xl p-2 text-center text-gray-800 text-lg font-semibold">
                🎁 DANH SÁCH QUÀ TẶNG
            </div>

            <div className="space-y-3 mt-3">
                {visibleRewards.map((reward) => (
                    <RewardItem
                        key={reward.id}
                        reward={reward}
                        userPoints={userPoints}
                        isRedeemed={redeemedRewardIds.has(
                            reward.id
                        )}
                        onRedeem={handleRedeem}
                    />
                ))}
            </div>

            {/* Điều hướng */}
            <div className="flex items-center justify-center gap-3 mt-4">
                <button
                    onClick={() =>
                        setPage(prev =>
                            Math.max(prev - 1, 0)
                        )
                    }
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
                    onClick={() =>
                        setPage(prev =>
                            Math.min(
                                prev + 1,
                                totalPages - 1
                            )
                        )
                    }
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
                                                onRedeem
                                            }: {
    reward: Reward
    userPoints: number
    isRedeemed: boolean
    onRedeem: (
        reward: Reward,
        quantity: number
    ) => void
}) {
    const [quantity, setQuantity] = useState(1)
    const [showError, setShowError] = useState(false)
    const [showForm, setShowForm] = useState(false)

    const totalPoints =
        reward.required_points * quantity

    const increase = () => {
        if (quantity < reward.stock) {
            setQuantity(q => q + 1)
        }
    }

    const decrease = () => {
        if (quantity > 1) {
            setQuantity(q => q - 1)
        }
    }

    const handleRedeemClick = () => {
        if (
            reward.stock < quantity ||
            userPoints < totalPoints
        ) {
            setShowError(true)
            return
        }

        setShowForm(true)
    }

    const handleSubmit = async () => {
        try {
            await onRedeem(reward, quantity)

            setShowForm(false)
        } catch (error) {
            alert("Có lỗi xảy ra")
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
                                quantity === 1
                                    ? "text-gray-300"
                                    : "hover:bg-gray-200"
                            }`}
                        >
                            -
                        </button>

                        <span className="w-10 text-center font-medium text-sm">
                            {quantity}
                        </span>

                        <button
                            onClick={increase}
                            disabled={
                                quantity === reward.stock
                            }
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                                quantity === reward.stock
                                    ? "text-gray-300"
                                    : "hover:bg-gray-200"
                            }`}
                        >
                            +
                        </button>
                    </div>

                    <div className="flex flex-col items-end">
                        <button
                            onClick={handleRedeemClick}
                            disabled={
                                reward.stock === 0 ||
                                isRedeemed
                            }
                            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                                reward.stock === 0 ||
                                isRedeemed
                                    ? "bg-gray-300 text-white cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md active:scale-95"
                            }`}
                        >
                            {isRedeemed
                                ? "Đã đổi"
                                : reward.stock === 0
                                    ? "Hết hàng"
                                    : "Đổi ngay"}
                        </button>

                        {isRedeemed && (
                            <span className="text-red-500 text-xs mt-1">
                                Quà đã đổi
                            </span>
                        )}
                    </div>
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
                            Bạn cần{" "}
                            <b>{totalPoints}</b> điểm nhưng hiện
                            chỉ có <b>{userPoints}</b> điểm.
                        </p>

                        <button
                            onClick={() =>
                                setShowError(false)
                            }
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* Modal xác nhận */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="w-full max-w-[380px] rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Xác nhận đổi quà
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Bạn có chắc muốn đổi phần quà này
                                không?
                            </p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() =>
                                    setShowForm(false)
                                }
                                className="flex-1 rounded-2xl border border-gray-200 bg-gray-100 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200 active:scale-95"
                            >
                                Huỷ
                            </button>

                            <button
                                onClick={handleSubmit}
                                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-95"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
})