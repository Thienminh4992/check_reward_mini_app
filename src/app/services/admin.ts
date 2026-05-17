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
    status: string
): Promise<RedeemRequest[]> {
    const res = await fetch(
        `/api/admin/redeem-requests?status=${status}`
    );

    if (!res.ok) {
        throw new Error("Fetch failed");
    }

    return res.json();
}

export async function approveRedeemRequest(
    id: string
): Promise<void> {
    const res = await fetch(
        `/api/admin/redeem-requests/${id}/approve`,
        {
            method: "POST",
        }
    );

    if (!res.ok) {
        throw new Error("Approve failed");
    }
}

export async function rejectRedeemRequest(
    id: string,
    reason: string
): Promise<void> {
    const res = await fetch(
        `/api/admin/redeem-requests/${id}/reject`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason }),
        }
    );

    if (!res.ok) {
        throw new Error("Reject failed");
    }
}