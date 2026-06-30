export interface User {
    id: string;
    telegram_id: number;
    telegram_name: string | null;
    uid: string;
    name: string | null;
    role: string;
    earned_point: number;
    redeemed_point: number;
    available_point: number;
    /** Chỉ có phía server — không trả về client */
    password_hash?: string | null;
    email?: string | null;
    telegram_account?: string | null;
    discord_account?: string | null;
    created_at: string;
    updated_at: string;
    avatar_url?: string | null;
}

export interface FamUser {
    uid: string;
    email: string | null;
    telegram_account: string | null;
    discord_account: string | null;
}

export interface Reward {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    required_points: number;
    stock: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ShippingInfo {
    name: string;
    phone: string;
    address: string;
}


export interface RedeemRequest {
    id: string;
    user_id: string;
    reward_id: string;
    quantity: number;
    status: "pending" | "approved" | "rejected";
    proof_image: string[] | null;
    shipping_info: ShippingInfo | null;
    admin_note: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserPointsHistory {
    id: string;
    reward_id: string;
    user_id: string;
    points_change: number;
    source: string;
    description: string | null;
    created_at: string;
}