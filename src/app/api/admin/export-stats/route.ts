// src/app/api/admin/export-stats/route.ts
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page") || 1)
    const limit = Number(searchParams.get("limit") || 10)

    // Gọi thẳng request nội bộ dùng headers gốc (không cần BASE_URL)
    const internalUrl = new URL(`/api/admin/stats`, req.url)
    internalUrl.searchParams.set("page", String(page))
    internalUrl.searchParams.set("limit", String(limit))

    const res = await fetch(internalUrl.toString(), {
        headers: req.headers, // giữ nguyên cookie/auth headers
    })

    if (!res.ok) {
        return NextResponse.json({ error: "Load stats failed" }, { status: 500 })
    }

    const data = await res.json()

    const rows = data.items.map((item: any, index: number) => ({
        STT: index + 1,
        UID: item.uid,
        "Người dùng": item.name,
        Email: item.email,
        "Số điện thoại": item.phone_number || "",
        "Quà tặng": item.reward_name,
        "Số lượng": item.quantity,
        "Điểm tiêu": item.required_points * item.quantity,
        "Ngày đổi": new Date(item.created_at).toLocaleString("vi-VN"),
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Redeem Stats")

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="redeem-stats-page-${page}.xlsx"`,
        },
    })
}