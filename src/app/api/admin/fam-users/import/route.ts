import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"
import { userFarmRepository } from "@/lib/userFarm.repository"
import { withTransaction, execute } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        const body = await req.json()
        const { rows } = body as { rows: Record<string, string>[] }

        if (!rows?.length) {
            return NextResponse.json(
                { error: "Thiếu dữ liệu" },
                { status: 400 }
            )
        }

        let inserted = 0
        let updated = 0
        let skipped = 0

        // Dùng withTransaction để batch upsert trong 1 transaction
        await withTransaction(async (client) => {
            for (const row of rows) {
                const uid = (row.uid || "").trim()
                const email = (row.email || "").trim() || null
                const telegram_account = (row.telegram_account || "").trim() || null
                const discord_account = (row.discord_account || "").trim() || null

                if (!uid) {
                    skipped++
                    continue
                }

                // Kiểm tra uid đã tồn tại chưa
                const existing = await userFarmRepository.getFamUserByUid(uid, client)
                if (existing) {
                    // Đã tồn tại -> UPDATE
                    await userFarmRepository.upsertFamUser(
                        { uid, email, telegram_account, discord_account },
                        client
                    )
                    updated++
                } else {
                    // Chưa tồn tại -> INSERT
                    await userFarmRepository.upsertFamUser(
                        { uid, email, telegram_account, discord_account },
                        client
                    )
                    inserted++
                }
            }
        })

        console.log("[fam-users-import] Result:", { inserted, updated, skipped })
        return NextResponse.json({ inserted, updated, skipped })
    } catch (e) {
        console.error("[fam-users-import] Error:", e)
        return NextResponse.json({ error: "Import thất bại: " + (e as Error).message }, { status: 500 })
    }
}
