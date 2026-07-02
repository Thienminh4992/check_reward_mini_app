import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"
import { userFarmRepository } from "@/lib/userFarm.repository"
import { withTransaction } from "@/lib/db"

/**
 * Extract mapped fields from a CSV row with flexible column name matching.
 * Supports both exact column names and variations like "email", "EMAIL", etc.
 */
function mapCsvRow(row: Record<string, string>) {
    // Normalize keys to lowercase for case-insensitive matching
    const normalized: Record<string, string> = {}
    for (const [key, value] of Object.entries(row)) {
        const keyStr = String(key).trim()
        const valStr = value != null ? String(value).trim() : ""
        const cleanKey = keyStr.toLowerCase().replace(/^[#\uFF10-\uFF19]+/, "").trim()
        normalized[cleanKey] = valStr
    }

    const getField = (...names: string[]) => {
        for (const name of names) {
            const lower = name.toLowerCase()
            if (lower in normalized && normalized[lower]) {
                return normalized[lower]
            }
        }
        return ""
    }

    return {
        uid: getField("uid"),
        email: getField("email"),
        telegram_account: getField("telegram_account", "telegram"),
        discord_account: getField("discord_account", "discord"),
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req)
    } catch {
        return adminResponse("Unauthorized", 401)
    }

    try {
        const body = await req.formData()
        const parsedDataStr = body.get("parsedData") as string | null

        if (!parsedDataStr) {
            return NextResponse.json(
                { error: "Thiếu dữ liệu CSV" },
                { status: 400 }
            )
        }

        const rows = JSON.parse(parsedDataStr) as Record<string, string>[]

        if (!rows?.length) {
            return NextResponse.json(
                { error: "Thiếu dữ liệu" },
                { status: 400 }
            )
        }

        let inserted = 0
        let updated = 0
        let skipped = 0
        let errors = 0
        const errorDetails: string[] = []

        // Map CSV rows to fam user fields
        const mappedItems: Array<{ mapped: { uid: string; email: string | null; telegram_account: string | null; discord_account: string | null }, lineNum: number }> = []

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const mapped = mapCsvRow(row)

            if (!mapped.uid) {
                errors++
                errorDetails.push(`Dòng ${i + 2}: Thiếu UID (header: ${Object.keys(row).join(", ")})`)
                continue
            }

            mappedItems.push({ mapped, lineNum: i + 2 })
        }

        // Upsert in transaction
        await withTransaction(async (client) => {
            for (const { mapped } of mappedItems) {
                const existing = await userFarmRepository.getFamUserByUid(mapped.uid, client)
                if (existing) {
                    await userFarmRepository.upsertFamUser(mapped, client)
                    updated++
                } else {
                    await userFarmRepository.upsertFamUser(mapped, client)
                    inserted++
                }
            }
        })

        console.log("[fam-users-import] Result:", { inserted, updated, skipped, errors })
        return NextResponse.json({
            inserted,
            updated,
            skipped,
            errors,
            errorDetails: errorDetails.slice(0, 10) // Return max 10 error messages
        })
    } catch (e) {
        console.error("[fam-users-import] Error:", e)
        return NextResponse.json({ error: "Import thất bại: " + (e as Error).message }, { status: 500 })
    }
}
