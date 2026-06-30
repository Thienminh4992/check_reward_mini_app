import { NextRequest, NextResponse } from "next/server"
import { volumeService } from "@/services/volume.service"

export async function POST(req: NextRequest) {
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
