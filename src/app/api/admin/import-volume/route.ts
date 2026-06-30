import { NextRequest, NextResponse } from "next/server"
import { volumeService } from "@/services/volume.service"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { rows, from, to } = body as {
            rows: Record<string, string>[]
            from: string
            to: string
        }

        if (!rows?.length || !from || !to) {
            return NextResponse.json(
                { error: "Thiếu dữ liệu" },
                { status: 400 }
            )
        }

        const fromDate = new Date(from)
        const toDate = new Date(to)
        // to date: tính đến cuối ngày
        toDate.setHours(23, 59, 59, 999)

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return NextResponse.json(
                { error: "Ngày không hợp lệ" },
                { status: 400 }
            )
        }

        const result = await volumeService.importTransactions(rows, fromDate, toDate)
        // console.log('RESULT IMPORT-VOLUME: ', result)
        return NextResponse.json(result)
    } catch (e) {
        console.error("[import-volume]", e)
        return NextResponse.json({ error: "Import thất bại" }, { status: 500 })
    }
}