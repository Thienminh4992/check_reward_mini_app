import {PoolClient} from "pg";
import {execute} from "@/lib/db";

export const volumeRepository = {
    // Upsert: nếu uid đã có thì cộng dồn
    upsertUserVolume(
        uid: string,
        volume: string,
        client: PoolClient
    ) {
        return execute(
            `INSERT INTO user_volume_agg (id, uid, total_volume_usd, total_orders)
             VALUES ($1, $2, $3, 0)
             ON CONFLICT (uid) DO UPDATE SET
                total_volume_usd = user_volume_agg.total_volume_usd + EXCLUDED.total_volume_usd,
                last_updated     = CURRENT_TIMESTAMP`,
            [crypto.randomUUID(), uid, volume],
            client
        )
    },
}
