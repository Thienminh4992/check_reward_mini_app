import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/user.service";

export async function POST(req: NextRequest) {
    try {
        const { telegram_id, telegram_name, uid, name } = await req.json();

        const user = await userService.telegramRegister({
            telegram_id,
            telegram_name,
            uid,
            name,
        });

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Register failed",
            },
            { status: 400 }
        );
    }
}