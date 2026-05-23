// src/app/api/rewards/route.ts
import { NextResponse } from "next/server";
import { userService } from "@/services/user.service";

export async function GET() {
    try {
        const rewards = await userService.getAvailableRewards();

        return NextResponse.json({
            success: true,
            data: rewards,
        });
    } catch (error) {
        console.error("GET /api/rewards error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch rewards",
            },
            { status: 500 }
        );
    }
}