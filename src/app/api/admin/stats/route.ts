import { NextRequest, NextResponse } from "next/server"
import { userService } from "@/services/user.service"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"

export async function GET(req: NextRequest) {
    try { await requireAdmin(req); } catch { return adminResponse("Unauthorized", 401); }
    try {
        const page = Number(
            req.nextUrl.searchParams.get(
                "page"
            ) || 1
        )

        const limit = Number(
            req.nextUrl.searchParams.get(
                "limit"
            ) || 10
        )

        const data =
            await userService.getApprovedRedeemStats(
                page,
                limit
            )

        return NextResponse.json(
            data
        )
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            {
                error:
                    "Internal server error",
            },
            { status: 500 }
        )
    }
}