import { withTransaction } from "@/lib/db"
import { volumeRepository } from "@/lib/volume.repository"

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

export const volumeService = {
    async importTransactions(
        rows: Record<string, string>[]
    ): Promise<ImportResult> {
        let inserted = 0
        let skipped = 0

        const volumeMap = new Map<string, number>()

        for (const row of rows) {
            try {
                const uid = row["UID"]?.trim()
                if (!uid) {
                    skipped++
                    continue
                }

                const volume = parseFloat(parseVolume(row["Volume"] ?? "0"))
                if (isNaN(volume)) {
                    skipped++
                    continue
                }

                // Cộng dồn volume theo UID
                volumeMap.set(uid, (volumeMap.get(uid) ?? 0) + volume)
                inserted++

            } catch {
                skipped++
            }
        }

        await withTransaction(async (client) => {
            // Upsert user_volume_agg (cộng dồn)
            for (const [uid, volume] of volumeMap.entries()) {
                await volumeRepository.upsertUserVolume(uid, String(volume), client)
            }
        })

        return { inserted, skipped }
    },
}
