// src/app/api/admin/export-stats/route.ts
import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"

interface ExportRedeemItem {
    uid: string
    name: string
    email: string
    phone_number: string
    address: string
    reward_name: string
    required_points: number
    quantity: number
    created_at: string
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page") || 1)
    const limit = Number(searchParams.get("limit") || 10)

    const internalUrl = new URL(`/api/admin/stats`, "http://localhost:3000")
    internalUrl.searchParams.set("page", String(page))
    internalUrl.searchParams.set("limit", String(limit))

    const res = await fetch(internalUrl.toString(), {
        headers: req.headers,
    })

    if (!res.ok) {
        return NextResponse.json({ error: "Load stats failed" }, { status: 500 })
    }

    const data = await res.json()

    const rows = data.items.map((item: ExportRedeemItem, index: number) => ({
        STT: index + 1,
        UID: item.uid,
        "Người dùng": item.name,
        Email: item.email,
        "Số điện thoại": item.phone_number || "",
        "Địa chỉ": item.address || "",
        "Quà tặng": item.reward_name,
        "Số lượng": item.quantity,
        "Điểm tiêu": item.required_points * item.quantity,
        "Ngày đổi": new Date(item.created_at).toLocaleString("vi-VN"),
    }))

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Redeem Stats")

    worksheet.columns = [
        { header: "STT", key: "STT" },
        { header: "UID", key: "UID" },
        { header: "Người dùng", key: "Người dùng" },
        { header: "Email", key: "Email" },
        { header: "Số điện thoại", key: "Số điện thoại" },
        { header: "Địa chỉ", key: "Địa chỉ" },
        { header: "Quà tặng", key: "Quà tặng" },
        { header: "Số lượng", key: "Số lượng" },
        { header: "Điểm tiêu", key: "Điểm tiêu" },
        { header: "Ngày đổi", key: "Ngày đổi" },
    ]

    worksheet.addRows(rows)

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer as ArrayBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="redeem-stats-page-${page}.xlsx"`,
        },
    })
}