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
        await userService.approveRequest(id);

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
                        : "Approve failed",
            },
            {
                status: 500,
            }
        );
    }
}