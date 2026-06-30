// src/app/home/page.tsx
"use client";

import {useEffect, useState, useCallback, useMemo,} from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import UserCard from "@/components/UserCard";
import RewardHistory from "@/components/RewardHistory";
// import RewardList from "@/components/RewardList";

import { useUser } from "@/context/UserContext";

import { UserDashboardResponse } from "@/types/user";
import { Reward } from "@/types/reward";

import { getRewards } from "@/app/services/reward";

import dynamic from "next/dynamic";

const RewardList = dynamic(
    () => import("@/components/RewardList"),
    {
        loading: () => (
            <div className="p-4 text-center text-gray-400">
                Đang tải danh sách quà...
            </div>
        ),
    }
);
export default function HomePage() {
    const router = useRouter();

    const { user, setUser } = useUser();

    const [dashboard, setDashboard] =
        useState<UserDashboardResponse | null>(
            null
        );

    const [rewards, setRewards] = useState<
        Reward[]
    >([]);

    // const [loading, setLoading] = useState(true);

    const [historyOpen, setHistoryOpen] =
        useState(false);

    const fetchUser = useCallback(async () => {
        const res = await fetch("/api/users/me", {
            credentials: "include",
        });

        if (res.status === 401) {
            router.replace("/login");
            return null;
        }

        if (!res.ok) {
            throw new Error(
                "Failed to load dashboard"
            );
        }

        const data =
            (await res.json()) as UserDashboardResponse;

        setDashboard(data);

        setUser((prev) => {
            if (
                prev &&
                prev.available_point === data.user.available_point &&
                prev.earned_point === data.user.earned_point &&
                prev.redeemed_point === data.user.redeemed_point
            ) {
                return prev;
            }

            return {
                id: data.user.id,
                telegram_id: data.user.telegram_id,
                telegram_name: data.user.telegram_name,
                uid: data.user.uid,
                name: data.user.name || "Thành viên",
                email: data.user.email || "",
                address: data.user.address || "",
                phone: data.user.phone || "",
                role: data.user.role,
                available_point: data.user.available_point,
                earned_point: data.user.earned_point,
                redeemed_point: data.user.redeemed_point,
                avatar_url: data.user.avatar_url,
            };
        });

        return data;
    }, [router, setUser]);

    const fetchRewards = useCallback(async () => {
        try {
            const list = await getRewards();

            setRewards(list);
        } catch {
            setRewards([]);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                await Promise.all([
                    fetchUser(),
                    fetchRewards(),
                ]);
            } finally {
                // setLoading(false);
            }
        };

        void load();
    }, [fetchUser, fetchRewards]);

    const reloadDashboard = useCallback(async () => {
        await Promise.all([
            fetchUser(),
            fetchRewards(),
        ]);
    }, [fetchUser, fetchRewards]);

    const rewardsHistory =
        dashboard?.reward_history_items?.map(
            (item) => ({
                id: item.id,
                reward_id: item.reward_id,
                name: item.name,
                points_change: item.points_change,
                description: item.description,
                source: item.source,
                status: item.status,
                icon: item.icon,
            })
        ) ?? [];

    const redeemedRewardIds = useMemo(() => {
        return new Set(
            dashboard?.reward_history_items
                ?.filter(
                    (item) => item.source === "redeem"
                )
                ?.map((item) => item.reward_id)
        );
    }, [dashboard]);
    // console.log("REDEEMEDREWARDIDS", redeemedRewardIds)
    if (!dashboard || !user) {
        return (
            <div className="h-screen flex flex-col bg-gray-100">
                <Header />

                <div className="animate-pulse p-4 space-y-4">
                    <div className="h-32 bg-gray-200 rounded-2xl" />
                    <div className="h-24 bg-gray-200 rounded-2xl" />
                    <div className="h-96 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header />

            <UserCard
                user={user}
                onOpenHistory={() =>
                    setHistoryOpen(true)
                }
            />

            {/* CHỈ DANH SÁCH QUÀ CUỘN */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-20 overscroll-contain">
                <RewardList
                    rewards={rewards}
                    redeemedRewardIds={redeemedRewardIds}
                    onReload={reloadDashboard}
                />
            </div>

            {historyOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
                    <button
                        type="button"
                        className="absolute inset-0"
                        onClick={() =>
                            setHistoryOpen(false)
                        }
                    />

                    <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 pb-8 m-0 sm:m-4">
                        <div className="flex justify-between items-center mb-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setHistoryOpen(
                                        false
                                    )
                                }
                                className="text-gray-500 text-sm px-2 py-1"
                            >
                                Đóng
                            </button>
                        </div>

                        <RewardHistory
                            items={
                                rewardsHistory
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}