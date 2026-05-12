export async function registerUser(payload: {
    telegram_id: number;
    telegram_name: string;
    uid: string;
    name: string;
}) {
    const res = await fetch("/api/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Register failed");
    }

    return data;
}