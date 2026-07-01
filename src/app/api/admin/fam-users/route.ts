import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"
import { userFarmRepository } from "@/lib/userFarm.repository"

export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        const url = new URL(req.url)
        const uid = url.searchParams.get("uid") || ""
        const page = parseInt(url.searchParams.get("page") || "1")
        const limit = parseInt(url.searchParams.get("limit") || "10")

        const result = await userFarmRepository.getFamUsers({ uid, page, limit })
        return NextResponse.json(result)
    } catch (e) {
        console.error("[fam-users]", e)
        return NextResponse.json({ error: "Lấy danh sách thất bại" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        const body = await req.json()
        const { uid, email, telegram_account, discord_account } = body

        if (!uid || !uid.trim()) {
            return NextResponse.json({ error: "UID là bắt buộc" }, { status: 400 })
        }

        await userFarmRepository.upsertFamUser({
            uid: uid.trim(),
            email: email || null,
            telegram_account: telegram_account || null,
            discord_account: discord_account || null,
        })

        return NextResponse.json({ message: "Tạo thành công" })
    } catch (e) {
        console.error("[create-fam-user]", e)
        return NextResponse.json({ error: "Tạo thất bại" }, { status: 500 })
    }
}
