// src/lib/auth.ts
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

export interface SessionPayload {
    userId: string;
    telegramId: number;
}

export function signToken(payload: SessionPayload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "7d",
    });
}

export function verifyToken(token: string): SessionPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch {
        return null;
    }
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) return null;

    return verifyToken(token);
}