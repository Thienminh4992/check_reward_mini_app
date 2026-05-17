"use client";

import {
    useEffect,
    useState,
    useCallback,
    useMemo,
} from "react";

import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import UserCard from "@/components/UserCard";
import PointsCard from "@/components/PointsCard";
import RewardHistory from "@/components/RewardHistory";
import RewardList from "@/components/RewardList";

import { useUser } from "@/context/UserContext";

import { UserDashboardResponse } from "@/types/user";
import { Reward } from "@/types/reward";

import { getRewards } from "@/app/services/reward";

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

    const [loading, setLoading] = useState(true);

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

        setUser({
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
                setLoading(false);
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

    const rewardsHistory = useMemo(() => {
        return (
            dashboard?.reward_history_items ??
            []
        ).map((item) => ({
            id: item.id,
            name: item.name,
            points_change:
            item.points_change,
            description:
            item.description,
            source: item.source,
            status: item.status,
            icon: item.icon,
        }));
    }, [dashboard]);

    if (loading || !dashboard || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-400 animate-pulse">
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header />

            <UserCard
                user={user}
                onOpenHistory={() =>
                    setHistoryOpen(true)
                }
            />

            {/*<PointsCard user={user} />*/}



            <RewardList
                rewards={rewards}
                onReload={reloadDashboard}
            />

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