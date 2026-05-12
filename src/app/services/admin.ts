/**
 * Stub — màn admin tạm không dùng; giữ type để component biên dịch được.
 */

export interface RedeemRequest {
    id: string;
    telegram_name: string;
    quantity: number;
    reward_name: string;
    status: string;
    shipping_info?: { phone: string; address: string };
    proof_image?: string[];
}

export async function getRedeemRequests(
    _status: string
): Promise<RedeemRequest[]> {
    return [];
}

export async function approveRedeemRequest(_id: string): Promise<void> {
    throw new Error("Admin API chưa được kết nối");
}

export async function rejectRedeemRequest(
    _id: string,
    _reason: string
): Promise<void> {
    throw new Error("Admin API chưa được kết nối");
}
