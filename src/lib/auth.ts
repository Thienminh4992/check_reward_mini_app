// src/lib/auth.ts

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface SessionPayload {
    userId: string;
    telegramId: number;
}

export function signToken(payload: SessionPayload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "30m", // 30 phút
    });
}

export function verifyToken(
    token: string
): SessionPayload | null {
    try {
        return jwt.verify(
            token,
            JWT_SECRET
        ) as SessionPayload;
    } catch {
        return null;
    }
}

export async function getCurrentUser() {
    const cookieStore = await cookies();

    const token =
        cookieStore.get("session_token")?.value;

    if (!token) {
        return null;
    }

    return verifyToken(token);
}