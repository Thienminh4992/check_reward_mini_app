// src/app/services/redeem.ts
export async function redeemReward(payload: {
    user_id: string
    reward_id: string
    quantity: number
    name: string

}) {
    // console.log("redeem payload:", payload)
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
