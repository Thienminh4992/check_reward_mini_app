export interface User {
    id: string;
    telegram_id: number;
    telegram_name?: string;
    uid: string;
    name: string;
    email?: string;
    address?: string;
    phone?: string;
    role: string;
    available_point: number;
    earned_point: number;
    redeemed_point: number;
    avatar_url?: string | null;
}

export interface RewardHistoryItem {
    id: string
    reward_id: string
    name: string
    points_change: number
    description: string
    source: string
    status: string
    icon: string
}

export interface UserDashboardResponse {
    user: User
    reward_history_items: RewardHistoryItem[]
    volume?: unknown
    approved_reward_ids?: string[]
}