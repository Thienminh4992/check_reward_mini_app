// src/app/services/admin.ts
export interface RedeemRequest {
    id: string;
    uid: string;
    name: string;
    telegram_id: string;
    phone_number: string;
    email: string;
    address: string;
    quantity: number;
    reward_name: string;
    status: string;
    page: number,
    limit: number,
    // shipping_info?: { phone: string; address: string };
    // proof_image?: string[];
}

export async function getRedeemRequests(
    status = "all",
    page = 1,
    limit = 10
) {
    const res = await fetch(
        `/api/admin/redeem-requests?status=${status}&page=${page}&limit=${limit}`
    )

    if (!res.ok) {
        throw new Error("Load failed")
    }

    return res.json()
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
export async function getUsers(
    uid = "",
    page = 1,
    limit = 10
) {
    const res = await fetch(
        `/api/admin/users?uid=${uid}&page=${page}&limit=${limit}`
    )

    if (!res.ok) {
        throw new Error("Load users failed")
    }

    return res.json()
}

export async function updateUser(
    id: string,
    payload: {
        name: string
        email?: string
        phone_number?: string
        address?: string
        role?: string
    }
) {
    const res = await fetch(
        `/api/admin/users/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(payload),
        }
    )

    if (!res.ok) {
        throw new Error("Update failed")
    }

    return res.json()
}

export async function deleteUser(id: string) {
    const res = await fetch(
        `/api/admin/users/${id}`,
        {
            method: "DELETE",
        }
    )

    if (!res.ok) {
        throw new Error("Delete failed")
    }
}