// src/app/services/redeem.ts
export async function redeemReward(payload: {
    user_id: string
    reward_id: string
    quantity: number
    name: string
    proof_image:  string[]
    shipping_info: {
        name: string
        phone: string
        address: string
    }
}) {
    console.log("redeem payload:", payload)
    const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!json.success) {
        throw new Error(json.error || "Redeem failed");
    }

    return json.data;
}
// export async function redeemReward(payload: {
//     telegram_id: number
//     reward_id: string
//     quantity: number
//     name: string
//     proof_image:  string[]
//     shipping_info: {
//         name: string
//         phone: string
//         address: string
//     }
// }) {
//     console.log('redeemReward', payload)
//     const res = await fetch(`${API_BASE}/redeem`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//     })
//
//     if (!res.ok) {
//         const error = await res.json()
//         throw new Error(error.detail || "Redeem failed")
//     }
//
//     return res.json()
// }