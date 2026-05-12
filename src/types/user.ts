export interface User {
    id: string
    telegram_id: number
    telegram_name: string | null
    uid: string
    name: string
    role: string
    available_point: number
    earned_point: number
    redeemed_point: number
}

export interface RewardHistoryItem {
    id: string
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
}