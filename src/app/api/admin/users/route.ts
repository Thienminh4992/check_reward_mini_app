import { NextRequest, NextResponse } from "next/server"
import { userService } from "@/services/user.service"

export async function GET(req: NextRequest) {
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