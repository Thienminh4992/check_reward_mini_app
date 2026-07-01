import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/user.service";
import { requireAdmin, adminResponse } from "@/lib/admin-middleware";

export async function POST(
    req: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try { await requireAdmin(req); } catch { return adminResponse("Unauthorized", 401); }
    try {
        const { id } = await context.params;
        const body = await req.json();

        await userService.rejectRequest(
            id,
            body.reason
        );

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Reject failed",
            },
            {
                status: 500,
            }
        );
    }
}