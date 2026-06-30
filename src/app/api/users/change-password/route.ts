import {
    NextRequest,
    NextResponse,
} from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { userService } from "@/services/user.service";

export async function PUT(
    req: NextRequest
) {
    const session =
        await getCurrentUser();

    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body =
            await req.json();

        const result =
            await userService.changePassword(
                session.userId,
                body.currentPassword,
                body.newPassword
            );

        return NextResponse.json(
            result
        );
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            },
            { status: 400 }
        );
    }
}