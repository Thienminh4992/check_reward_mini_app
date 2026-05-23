// src/app/api/admin/rewards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userRepository } from "@/lib/repository";
import { userService } from "@/services/user.service";

// =========================
// Helper: kiểm tra admin
// =========================
async function requireAdmin() {
    const session = await getCurrentUser();
    if (!session) return null;

    const user = await userRepository.getUserById(session.userId);
    if (!user || user.role !== "admin") return null;

    return user;
}

// =========================
// GET /api/admin/rewards
// Lấy tất cả rewards (kể cả is_active = false)
// =========================
export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const rewards = await userService.getAvailableRewards();

        return NextResponse.json({ success: true, data: rewards });

    } catch (error) {
        console.error("GET /api/admin/rewards error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 }
        );
    }
}

// =========================
// POST /api/admin/rewards
// Tạo reward mới
// =========================
export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { name, description, image_url, required_points, stock } = body;

        // Validate
        if (!name || required_points == null || stock == null) {
            return NextResponse.json(
                { success: false, message: "Thiếu thông tin bắt buộc: name, required_points, stock" },
                { status: 400 }
            );
        }

        if (required_points < 0 || stock < 0) {
            return NextResponse.json(
                { success: false, message: "Điểm và số lượng không được âm" },
                { status: 400 }
            );
        }

        const reward = await userService.createReward({
            name: name.trim(),
            description: description?.trim() ?? null,
            image_url: image_url ?? null,
            required_points: Number(required_points),
            stock: Number(stock),
        });

        return NextResponse.json(
            { success: true, data: reward },
            { status: 201 }
        );

    } catch (error) {
        console.error("POST /api/admin/rewards error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 }
        );
    }
}