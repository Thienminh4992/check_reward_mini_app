import {
    NextRequest,
    NextResponse,
} from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { userService } from "@/services/user.service";

export async function PUT(req: NextRequest) {
    const session = await getCurrentUser();

    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();

        const result =
            await userService.updateProfile(
                session.userId,
                {
                    name: body.name,
                    email: body.email,
                    address: body.address,
                    phone_number: body.phone,
                    uid: body.uid,
                }
            );

        switch (result.status) {
            case "invalid_name":
                return NextResponse.json(
                    { error: "Tên không hợp lệ" },
                    { status: 400 }
                );

            case "invalid_email":
                return NextResponse.json(
                    { error: "Email không hợp lệ" },
                    { status: 400 }
                );

            case "invalid_phone":
                return NextResponse.json(
                    {
                        error:
                            "Số điện thoại không hợp lệ",
                    },
                    { status: 400 }
                );

            case "ok":
                return NextResponse.json({
                    success: true,
                    user: result.user,
                });
        }
    } catch {
        return NextResponse.json(
            {
                error: "Internal server error",
            },
            { status: 500 }
        );
    }
}