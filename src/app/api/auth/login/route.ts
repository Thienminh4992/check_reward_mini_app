// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { getMockTelegramUser, verifyTelegramInitData } from "@/lib/telegram";
import { userService } from "@/services/user.service";

interface LoginBody {
    uid?: string;
    password?: string;
    initData?: string | null;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as LoginBody;
        const uid = typeof body.uid === "string" ? body.uid.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (!uid || !password) {
            return NextResponse.json(
                { success: false, error: "Thiếu UID hoặc mật khẩu" },
                { status: 400 }
            );
        }

        let telegramUser;

        if (body.initData && process.env.TELEGRAM_BOT_TOKEN) {
            telegramUser = verifyTelegramInitData(
                body.initData,
                process.env.TELEGRAM_BOT_TOKEN
            );
        } else {
            telegramUser = getMockTelegramUser();
        }

        if (!telegramUser) {
            return NextResponse.json(
                { success: false, error: "Dữ liệu Telegram không hợp lệ" },
                { status: 401 }
            );
        }

        const result = await userService.loginWithUidPassword(
            uid,
            password,
            telegramUser.id
        );

        if (result.status === "not_found") {
            return NextResponse.json({
                success: false,
                needs_register: true,
            });
        }

        if (result.status === "wrong_password") {
            return NextResponse.json(
                { success: false, error: "Sai mật khẩu" },
                { status: 401 }
            );
        }

        if (result.status === "no_password") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Tài khoản chưa đặt mật khẩu — liên hệ admin",
                },
                { status: 400 }
            );
        }

        if (result.status === "telegram_mismatch") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "UID không khớp với tài khoản Telegram đang mở mini app",
                },
                { status: 403 }
            );
        }

        const token = signToken({
            userId: result.user.id,
            telegramId: telegramUser.id,
        });

        const response = NextResponse.json({
            success: true,
            user: result.user,
        });

        response.cookies.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { success: false, error: "Đăng nhập thất bại" },
            { status: 500 }
        );
    }
}
