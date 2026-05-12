"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import UserCard from "@/components/UserCard";
import PointsCard from "@/components/PointsCard";
import RewardHistory from "@/components/RewardHistory";
import { useUser } from "@/context/UserContext";
import { UserDashboardResponse } from "@/types/user";

export default function HomePage() {
    const { user, setUser } = useUser();

    const [data, setData] = useState<UserDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch("/api/users/me");
                const dashboard: UserDashboardResponse = await res.json();

                setData(dashboard);

                setUser({
                    id: dashboard.user.id,
                    telegram_id: dashboard.user.telegram_id,
                    telegram_name: dashboard.user.telegram_name,
                    uid: dashboard.user.uid,
                    name: dashboard.user.name || "Unknown",
                    available_point: dashboard.user.available_point,
                    earned_point: dashboard.user.earned_point,
                    redeemed_point: dashboard.user.redeemed_point,
                });
            } catch (err) {
                console.error("Failed to load dashboard", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [setUser]);
    console.log(user);
    console.log(data);
    // if (loading) return <div>Loading...</div>;
    if (!data || !user) return <div>No data</div>;

    const rewardsHistory = (data.reward_history_items || []).map((item) => ({
        id: item.id,
        name: item.name,
        points_change: item.points_change,
        description: item.description,
        source: item.source,
        status: item.status,
        icon: "",
    }));

    return (
        <div>
            <Header />
            <UserCard user={user} />
            <PointsCard user={user} />
            <RewardHistory items={rewardsHistory} />
        </div>
    );
}