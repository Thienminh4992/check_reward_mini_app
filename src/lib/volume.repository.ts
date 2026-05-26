import {PoolClient} from "pg";
import {execute} from "@/lib/db";

export const volumeRepository = {
    // Xóa toàn bộ transactions cũ
    clearTransactions(client?: PoolClient) {
        return execute(
            `DELETE FROM transactions`,
            [],
            client
        )
    },

    bulkInsertTransactions(
        data: {
            order_no: string
            uid: string
            volume: string
            finish_time: Date
        }[],
        client: PoolClient
    ) {
        if (data.length === 0) return

        const values = data.map((_, i) => {
            const base = i * 5

            return `(
            $${base + 1},
            $${base + 2},
            $${base + 3},
            $${base + 4},
            $${base + 5}
        )`
        }).join(", ")

        const params = data.flatMap(item => [
            crypto.randomUUID(),
            item.order_no,
            item.uid,
            item.volume,
            item.finish_time,
        ])

        return execute(
            `
                INSERT INTO transactions (
                    id,
                    order_no,
                    uid,
                    volume_usd,
                    finish_time
                )
                VALUES ${values}
            `,
            params,
            client
        )
    },

    // Upsert: nếu uid đã có thì cộng dồn
    upsertUserVolume(
        uid: string,
        volume: string,
        orders: number,
        client: PoolClient
    ) {
        return execute(
            `INSERT INTO user_volume_agg (id, uid, total_volume_usd, total_orders)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (uid) DO UPDATE SET
                total_volume_usd = user_volume_agg.total_volume_usd + EXCLUDED.total_volume_usd,
                total_orders     = user_volume_agg.total_orders + EXCLUDED.total_orders,
                last_updated     = CURRENT_TIMESTAMP`,
            [crypto.randomUUID(), uid, volume, orders],
            client
        )
    },
}