// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData, getMockTelegramUser } from "@/lib/telegram";
import { signToken } from "@/lib/auth";
import { userService } from "@/services/user.service";

export async function POST(req: NextRequest) {
    try {
        const { initData } = await req.json();

        let telegramUser;

        if (initData && process.env.TELEGRAM_BOT_TOKEN) {
            telegramUser = verifyTelegramInitData(
                initData,
                process.env.TELEGRAM_BOT_TOKEN
            );
        } else {
            telegramUser = getMockTelegramUser();
        }

        if (!telegramUser) {
            return NextResponse.json(
                { error: "Invalid telegram data" },
                { status: 401 }
            );
        }

        const result = await userService.telegramLogin(telegramUser.id);

        console.log('src/app/api/auth/route.ts- RESULT:', result);

        if (!result.exists || !result.user) {
            return NextResponse.json({
                success: true,
                needs_register: true,
                telegram: telegramUser,
            });
        }

        const token = signToken({
            userId: result.user.id,
            telegramId: telegramUser.id,
        });

        const response = NextResponse.json({
            success: true,
            needs_register: false,
            user: result.user,
        });

        response.cookies.set("session_token", token, {
            httpOnly: true,
            secure: false,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}