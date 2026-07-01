import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"
import { userFarmRepository } from "@/lib/userFarm.repository"

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        const { uid } = await params
        await userFarmRepository.deleteFamUser(uid)
        return NextResponse.json({ message: "Xóa thành công" })
    } catch (e) {
        console.error("[fam-users-delete]", e)
        return NextResponse.json({ error: "Xóa thất bại" }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        const { uid } = await params
        const body = await req.json()
        const { email, telegram_account, discord_account } = body

        await userFarmRepository.upsertFamUser({
            uid,
            email: email || null,
            telegram_account: telegram_account || null,
            discord_account: discord_account || null,
        })
        return NextResponse.json({ message: "Cập nhật thành công" })
    } catch (e) {
        console.error("[fam-users-update]", e)
        return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 })
    }
}
