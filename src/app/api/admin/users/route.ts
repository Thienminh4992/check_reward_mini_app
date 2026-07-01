import { NextRequest, NextResponse } from "next/server"
import { userService } from "@/services/user.service"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"

export async function GET(req: NextRequest) {
    try { await requireAdmin(req); } catch { return adminResponse("Unauthorized", 401); }
    try {
        const uid =
            req.nextUrl.searchParams.get("uid") || ""

        const page = Number(
            req.nextUrl.searchParams.get("page") || 1
        )

        const limit = Number(
            req.nextUrl.searchParams.get("limit") || 10
        )

        const data = await userService.getUsers(
            uid,
            page,
            limit
        )

        return NextResponse.json(data)
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try { await requireAdmin(req); } catch { return adminResponse("Unauthorized", 401); }
    try {
        const body = await req.json()

        const user =
            await userService.createUserByAdmin(
                body
            )

        return NextResponse.json(user)
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Create failed",
            },
            { status: 500 }
        )
    }
}