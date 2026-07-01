import { PoolClient } from "pg";
import { execute, query, queryOne } from "@/lib/db";
import { FamUser } from "@/db/schema";

/** Safe column list for fam_users queries */
const FAM_USER_SAFE_SQL = `
  uid, email, telegram_account, discord_account, created_at
`;

export const userFarmRepository = {
    // =========================
    // FAM USERS
    // =========================
    getFamUserByUid(uid: string, client?: PoolClient) {
        return queryOne<FamUser>(
            `SELECT uid, email, telegram_account, discord_account FROM fam_users WHERE uid = $1`,
            [uid],
            client
        );
    },

    async getFamUsers(
        params: {
            uid?: string
            page?: number
            limit?: number
        },
        client?: PoolClient
    ) {
        const { uid = "", page = 1, limit = 10 } = params
        const offset = (page - 1) * limit

        const values: unknown[] = []
        let whereSql = ""

        if (uid.trim()) {
            values.push(`%${uid.trim()}%`)
            whereSql = `WHERE f.uid ILIKE $${values.length}`
        }

        values.push(limit)
        values.push(offset)

        const limitIndex = values.length - 1
        const offsetIndex = values.length

        const items = await query<FamUser>(
            `
        SELECT ${FAM_USER_SAFE_SQL}
        FROM fam_users f
        ${whereSql}
        ORDER BY f.created_at DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
        `,
            values,
            client
        )

        // count
        const countValues: unknown[] = []
        let countWhere = ""

        if (uid.trim()) {
            countValues.push(`%${uid.trim()}%`)
            countWhere = `WHERE f.uid ILIKE $1`
        }

        const countResult = await queryOne<{ total: number }>(
            `
        SELECT COUNT(*)::int as total
        FROM fam_users f
        ${countWhere}
        `,
            countValues,
            client
        )

        return {
            items,
            total: countResult?.total ?? 0,
            page,
            limit,
        }
    },

    upsertFamUser(data: {
        uid: string
        email: string | null
        telegram_account: string | null
        discord_account: string | null
    }, client?: PoolClient) {
        return execute(
            `
        INSERT INTO fam_users (uid, email, telegram_account, discord_account)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (uid) DO UPDATE SET
            email = EXCLUDED.email,
            telegram_account = EXCLUDED.telegram_account,
            discord_account = EXCLUDED.discord_account
        `,
            [data.uid, data.email, data.telegram_account, data.discord_account],
            client
        )
    },

    deleteFamUser(uid: string, client?: PoolClient) {
        return execute(
            `DELETE FROM fam_users WHERE uid = $1`,
            [uid],
            client
        )
    },
};
