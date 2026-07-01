import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userRepository } from "@/lib/repository";

export async function requireAdmin(_req: NextRequest): Promise<true> {
    const session = await getCurrentUser();
    if (!session) {
        throw new Error("Unauthorized");
    }
    const user = await userRepository.getUserById(session.userId);
    if (!user || user.role !== "admin") {
        throw new Error("Forbidden");
    }
    return true;
}

export function adminResponse(error: string, status: number): NextResponse {
    return NextResponse.json({ error }, { status });
}
