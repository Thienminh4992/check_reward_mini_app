import { NextRequest, NextResponse } from "next/server"
import { volumeService } from "@/services/volume.service"
import { requireAdmin, adminResponse } from "@/lib/admin-middleware"

export async function POST(req: NextRequest) {
    try { await requireAdmin(req); } catch { return adminResponse("Unauthorized", 401); }
    try {
        const body = await req.json()
        const { rows } = body as {
            rows: Record<string, string>[]
        }

        if (!rows?.length) {
            return NextResponse.json(
                { error: "Thiếu dữ liệu" },
                { status: 400 }
            )
        }

        const result = await volumeService.importTransactions(rows)
        return NextResponse.json(result)
    } catch (e) {
        console.error("[import-volume]", e)
        return NextResponse.json({ error: "Import thất bại" }, { status: 500 })
    }
}
