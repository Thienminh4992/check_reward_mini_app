import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { getMockTelegramUser, verifyTelegramInitData } from "@/lib/telegram";
import { userService } from "@/services/user.service";

interface RegisterBody {
    email?: string;
    uid?: string;
    telegram_account?: string;
    discord_account?: string;
    password?: string;
    initData?: string | null;
}

function mapRegisterError(code: string): { status: number; message: string } {
    switch (code) {
        case "USER_EXISTS":
            return { status: 409, message: "Tài khoản với UID này đã tồn tại" };
        case "TELEGRAM_TAKEN":
            return {
                status: 409,
                message: "Telegram này đã được liên kết với tài khoản khác",
            };
        case "FAM_NOT_FOUND":
            return {
                status: 400,
                message: "UID không có trong danh sách FAM",
            };
        case "FAM_NOT_VERIFIABLE":
            return {
                status: 400,
                message: "Không thể xác thực FAM — thiếu dữ liệu tham chiếu",
            };
        case "FAM_MISMATCH":
            return {
                status: 400,
                message:
                    "Xác thực thất bại: email / Telegram / Discord không khớp với dữ liệu FAM",
            };
        default:
            return { status: 400, message: code };
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as RegisterBody;

        const email = typeof body.email === "string" ? body.email.trim() : "";
        const uid = typeof body.uid === "string" ? body.uid.trim() : "";
        const telegram_account =
            typeof body.telegram_account === "string"
                ? body.telegram_account.trim()
                : "";
        const discord_account =
            typeof body.discord_account === "string"
                ? body.discord_account.trim()
                : "";
        const password =
            typeof body.password === "string" ? body.password : "";

        if (!email || !uid || !telegram_account || !discord_account || !password) {
            return NextResponse.json(
                { success: false, error: "Vui lòng nhập đủ các trường bắt buộc" },
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

        const user = await userService.registerWithFamVerification({
            telegram_id: telegramUser.id,
            telegram_name: telegramUser.username ?? telegramUser.first_name ?? null,
            uid,
            email,
            telegram_account,
            discord_account,
            password,
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Lỗi đăng ký" },
                { status: 500 }
            );
        }

        const token = signToken({
            userId: user.id,
            telegramId: telegramUser.id,
        });

        const response = NextResponse.json({
            success: true,
            user,
        });

        response.cookies.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Register failed";
        const mapped = mapRegisterError(message);
        return NextResponse.json(
            { success: false, error: mapped.message },
            { status: mapped.status }
        );
    }
}
