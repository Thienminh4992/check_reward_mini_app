// src/app/api/admin/rewards/[id]/route.ts
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
// PUT /api/admin/rewards/[id]
// Cập nhật reward
// =========================
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ← thêm Promise
) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Kiểm tra reward tồn tại
        const existing = await userRepository.getRewardById(id);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Reward không tồn tại" },
                { status: 404 }
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

        const updated = await userService.updateReward(id, {
            name: name.trim(),
            description: description?.trim() ?? null,
            // Nếu không upload ảnh mới thì giữ nguyên ảnh cũ
            image_url: image_url ?? existing.image_url ?? null,
            required_points: Number(required_points),
            stock: Number(stock),
        });

        return NextResponse.json({ success: true, data: updated });

    } catch (error) {
        console.error("PUT /api/admin/rewards/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 }
        );
    }
}

// =========================
// DELETE /api/admin/rewards/[id]
// Xoá mềm reward
// =========================
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ← thêm Promise
) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const { id } = await params;  // ← thêm await

        // Kiểm tra reward tồn tại
        const existing = await userRepository.getRewardById(id);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Reward không tồn tại" },
                { status: 404 }
            );
        }

        await userService.deleteReward(id);

        return NextResponse.json({
            success: true,
            message: "Đã xoá quà tặng",
        });

    } catch (error) {
        console.error("DELETE /api/admin/rewards/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 }
        );
    }
}