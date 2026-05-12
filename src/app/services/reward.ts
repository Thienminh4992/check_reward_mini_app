// src/app/services/reward.ts
export async function getRewards() {
    const res = await fetch("/api/rewards");

    const json = await res.json();

    if (!json.success) {
        throw new Error(json.message || "Failed to fetch rewards");
    }

    return json.data;
}