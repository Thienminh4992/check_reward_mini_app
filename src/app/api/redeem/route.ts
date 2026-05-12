// src/app/api/redeem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/user.service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            user_id,
            reward_id,
            quantity,
            shipping_info,
            proof_image,
        } = body;

        if (!user_id || !reward_id || !quantity) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields",
                },
                { status: 400 }
            );
        }

        const request = await userService.createRequest({
            user_id,
            reward_id,
            quantity,
            shipping_info,
            proof_image,
        });

        return NextResponse.json({
            success: true,
            data: request,
        });
    } catch (error: unknown) {
        console.error("POST /api/redeem error:", error);

        const message =
            error instanceof Error ? error.message : "Redeem failed";

        return NextResponse.json(
            {
                success: false,
                error: message,
            },
            { status: 400 }
        );
    }
}