import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    writeFile,
    mkdir,
} from "fs/promises";

import path from "path";

import { getCurrentUser }
    from "@/lib/auth";

import { userService }
    from "@/services/user.service";

export async function POST(
    req: NextRequest
) {
    try {
        const session =
            await getCurrentUser();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unauthorized",
                },
                { status: 401 }
            );
        }

        const formData =
            await req.formData();

        const file =
            formData.get(
                "file"
            ) as File | null;

        if (!file) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "No file",
                },
                { status: 400 }
            );
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Chỉ jpg png webp",
                },
                { status: 400 }
            );
        }

        const MAX_SIZE =
            2 * 1024 * 1024;

        if (
            file.size > MAX_SIZE
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Tối đa 2MB",
                },
                { status: 400 }
            );
        }

        const uploadDir =
            path.join(
                process.cwd(),
                "public/images/avatar"
            );

        await mkdir(
            uploadDir,
            {
                recursive: true,
            }
        );

        const ext =
            file.name
                .split(".")
                .pop();

        const filename =
            `${session.userId}.${ext}`;

        const filepath =
            path.join(
                uploadDir,
                filename
            );

        const bytes =
            await file.arrayBuffer();

        await writeFile(
            filepath,
            Buffer.from(bytes)
        );

        const avatarUrl =
            `/images/avatar/${filename}`;

        await userService.updateAvatar(
            session.userId,
            avatarUrl
        );

        return NextResponse.json({
            success: true,
            url: avatarUrl,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message:
                    "Upload thất bại",
            },
            { status: 500 }
        );
    }
}