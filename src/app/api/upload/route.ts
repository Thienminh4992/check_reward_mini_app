// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { userRepository } from "@/lib/repository";

export async function POST(req: NextRequest) {
    try {
        // 1. Kiểm tra auth
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Kiểm tra role admin
        const user = await userRepository.getUserById(session.userId);
        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        // 3. Lấy file từ form
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No file provided" },
                { status: 400 }
            );
        }

        // 4. Validate type & size
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: "Chỉ chấp nhận jpg, png, webp" },
                { status: 400 }
            );
        }

        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { success: false, message: "Ảnh không được vượt quá 2MB" },
                { status: 400 }
            );
        }

        // 5. Tạo thư mục nếu chưa có
        const uploadDir = path.join(process.cwd(), "public/images/rewards");
        await mkdir(uploadDir, { recursive: true });

        // 6. Tạo tên file unique & ghi vào disk
        const ext = file.name.split(".").pop();
        const filename = `${Date.now()}_${crypto.randomUUID()}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        // 7. Trả về url public
        const url = `/images/rewards/${filename}`;

        return NextResponse.json({ success: true, url });

    } catch (error) {
        console.error("POST /api/upload error:", error);
        return NextResponse.json(
            { success: false, message: "Upload thất bại" },
            { status: 500 }
        );
    }
}