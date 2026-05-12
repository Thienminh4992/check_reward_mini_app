"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import UserCard from "@/components/UserCard";
import PointsCard from "@/components/PointsCard";
import RewardHistory from "@/components/RewardHistory";
import RewardList from "@/components/RewardList";
import { useUser } from "@/context/UserContext";
import { UserDashboardResponse } from "@/types/user";
import { getRewards } from "@/app/services/reward";
import { Reward } from "@/types/reward";

export default function HomePage() {
    const router = useRouter();
    const { user, setUser } = useUser();

    const [data, setData] = useState<UserDashboardResponse | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyOpen, setHistoryOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/users/me");
                if (res.status === 401) {
                    router.replace("/");
                    return;
                }

                if (!res.ok) {
                    router.replace("/");
                    return;
                }

                const dashboard = (await res.json()) as UserDashboardResponse;

                setData(dashboard);

                setUser({
                    id: dashboard.user.id,
                    telegram_id: dashboard.user.telegram_id,
                    telegram_name: dashboard.user.telegram_name,
                    uid: dashboard.user.uid,
                    name: dashboard.user.name || "Thành viên",
                    role: dashboard.user.role,
                    available_point: dashboard.user.available_point,
                    earned_point: dashboard.user.earned_point,
                    redeemed_point: dashboard.user.redeemed_point,
                });

                try {
                    const list = await getRewards();
                    setRewards(list);
                } catch {
                    setRewards([]);
                }
            } catch {
                router.replace("/");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [router, setUser]);

    if (loading || !data || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Đang tải...
            </div>
        );
    }

    const rewardsHistory = (data.reward_history_items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        points_change: item.points_change,
        description: item.description,
        source: item.source,
        status: item.status,
        icon: item.icon,
    }));

    return (
        <div>
            <Header />
            <UserCard user={user} />
            <PointsCard user={user} />

            <div className="mx-4 mt-4">
                <button
                    type="button"
                    onClick={() => setHistoryOpen(true)}
                    className="w-full py-3 rounded-xl bg-white shadow text-gray-800 font-medium border border-gray-100"
                >
                    Lịch sử đổi quà
                </button>
            </div>

            <div className="mx-4 mt-8 mb-2">
                <h2 className="font-semibold text-gray-800 text-lg">
                    Danh sách quà tặng
                </h2>
            </div>

            <RewardList rewards={rewards} />

            {historyOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        className="absolute inset-0 cursor-default"
                        aria-label="Đóng"
                        onClick={() => setHistoryOpen(false)}
                    />

                    <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 pb-8 m-0 sm:m-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">
                                Lịch sử đổi quà
                            </h3>
                            <button
                                type="button"
                                onClick={() => setHistoryOpen(false)}
                                className="text-gray-500 text-sm px-2 py-1"
                            >
                                Đóng
                            </button>
                        </div>
                        <RewardHistory items={rewardsHistory} />
                    </div>
                </div>
            )}
        </div>
    );
}
