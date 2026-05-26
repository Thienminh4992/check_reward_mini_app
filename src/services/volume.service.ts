import { withTransaction } from "@/lib/db"
import { volumeRepository } from "@/lib/volume.repository"

export interface TransactionRow {
    order_no: string
    uid: string
    volume: string
    finish_time: Date
}

export interface ImportResult {
    inserted: number
    skipped: number
}

function parseVolume(raw: string): string {
    // "99.073.049" → "99073049"  |  "99.073049" → "99.073049"
    const parts = raw.trim().split(".")
    if (parts.length > 2) {
        // dấu chấm là phân cách nghìn (VN format)
        return parts.join("")
    }
    return raw.trim().replace(",", ".")
}

function parseFinishTime(raw: string): Date | null {
    // format: "25/05/2026 23:55"

    const cleaned = raw.trim()

    const match = cleaned.match(
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
    )

    if (!match) return null

    const [, dd, mm, yyyy, hh, min] = match

    const d = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min)
    )

    return isNaN(d.getTime()) ? null : d
}

export const volumeService = {
    async importTransactions(
        rows: Record<string, string>[],
        from: Date,
        to: Date
    ): Promise<ImportResult> {
        let inserted = 0
        let skipped = 0

        const seenOrders = new Set<string>()
        const transactions: TransactionRow[] = []
        const volumeMap = new Map<string, number>()
        const orderCountMap = new Map<string, number>()
        console.log("ROW IMPORT-VOLUME: ", rows)
        for (const row of rows) {
            try {
                const order_no = row["order_no"]?.trim()
                if (!order_no || seenOrders.has(order_no)) {
                    skipped++
                    continue
                }

                const uid = row["UID"]?.trim()
                if (!uid) {
                    skipped++
                    continue
                }

                const finish_time = parseFinishTime(row["finish_time"] ?? "")
                if (!finish_time) {
                    skipped++
                    continue
                }

                // Lọc theo date range
                if (finish_time < from || finish_time > to) {
                    skipped++
                    continue
                }

                const volume = parseFloat(parseVolume(row["Volume"] ?? "0"))
                if (isNaN(volume)) {
                    skipped++
                    continue
                }

                seenOrders.add(order_no)
                transactions.push({
                    order_no,
                    uid,
                    volume: String(volume),
                    finish_time,
                })

                volumeMap.set(uid, (volumeMap.get(uid) ?? 0) + volume)
                orderCountMap.set(uid, (orderCountMap.get(uid) ?? 0) + 1)
                inserted++

            } catch {
                skipped++
            }
        }

        await withTransaction(async (client) => {
            // Xóa toàn bộ transactions cũ
            await volumeRepository.clearTransactions(client)

            // Bulk insert transactions mới
            await volumeRepository.bulkInsertTransactions(transactions, client)

            // Upsert user_volume_agg (cộng dồn)
            for (const [uid, volume] of volumeMap.entries()) {
                const orders = orderCountMap.get(uid) ?? 0
                await volumeRepository.upsertUserVolume(
                    uid,
                    String(volume),
                    orders,
                    client
                )
            }
        })

        return { inserted, skipped }
    },
}