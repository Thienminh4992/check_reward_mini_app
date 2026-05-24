import { NextRequest, NextResponse } from "next/server"
import { userService } from "@/services/user.service"

interface Params {
    params: Promise<{
        id: string
    }>
}

export async function PUT(
    req: NextRequest,
    { params }: Params
) {
    try {
        const { id } = await params

        const body = await req.json()

        const user =
            await userService.updateUserAdmin(
                id,
                body
            )

        return NextResponse.json(user)
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            { error: "Update failed" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    _: NextRequest,
    { params }: Params
) {
    try {
        const { id } = await params

        await userService.deleteUser(id)

        return NextResponse.json({
            success: true,
        })
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            { error: "Delete failed" },
            { status: 500 }
        )
    }
}