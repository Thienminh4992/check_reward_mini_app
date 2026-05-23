// src/lib/telegram.ts
import crypto from "crypto";

export interface TelegramUser {
    id: number;
    username?: string;
    first_name?: string;
}

export function verifyTelegramInitData(initData: string, botToken: string): TelegramUser | null {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get("hash");
        if (!hash) return null;

        params.delete("hash");

        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");

        const secret = crypto
            .createHmac("sha256", "WebAppData")
            .update(botToken)
            .digest();

        const computedHash = crypto
            .createHmac("sha256", secret)
            .update(dataCheckString)
            .digest("hex");

        if (computedHash !== hash) return null;

        const userRaw = params.get("user");
        if (!userRaw) return null;

        return JSON.parse(userRaw);
    } catch {
        return null;
    }
}

export function getMockTelegramUser(): TelegramUser {
    return {
        id: 5253676380,
        username: "mock_user",
        first_name: "Mock User",
    };
}