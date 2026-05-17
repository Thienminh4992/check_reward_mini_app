import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { userService } from "@/services/user.service";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("session_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const dashboard = await userService.getDashboard(payload.userId);
        console.log('/me/route.ts dashboard', dashboard);
        return NextResponse.json(dashboard);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}