// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
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

        if (!user) return null;
        console.log('register/route.ts USER', user)
        const token = signToken({
            userId: user.id,
            telegramId: telegram_id,
        });

        const response = NextResponse.json({
            success: true,
            user,
        });

        response.cookies.set("session_token", token, {
            httpOnly: true,
            secure: false,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Register failed",
            },
            { status: 400 }
        );
    }
}