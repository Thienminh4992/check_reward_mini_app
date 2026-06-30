import { PoolClient } from "pg";
import { execute, query, queryOne } from "@/lib/db";
import {
    Reward,
    User,
    RedeemRequest,
    UserPointsHistory,
    FamUser,
} from "@/db/schema";

/** Không bao gồm password_hash — dùng cho API/client */
const USER_SAFE_SQL = `
  id, telegram_id, telegram_name, uid, name, role,
  earned_point, redeemed_point, available_point,
  email, phone_number, address, avatar_url,
  created_at, updated_at
`;

export const userRepository = {
    // =========================
    // SELECT
    // =========================
    getByUid(uid: string, client?: PoolClient) {
        return queryOne<User>(
            `SELECT ${USER_SAFE_SQL} FROM users WHERE uid = $1`,
            [uid],
            client
        );
    },

    getUserWithPasswordByUid(uid: string, client?: PoolClient) {
        return queryOne<User>(
            `SELECT ${USER_SAFE_SQL}, password_hash FROM users WHERE uid = $1`,
            [uid],
            client
        );
    },

    getFamUserByUid(uid: string, client?: PoolClient) {
        return queryOne<FamUser>(
            `SELECT uid, email, telegram_account, discord_account FROM fam_users WHERE uid = $1`,
            [uid],
            client
        );
    },

    getUserByTelegramId(telegramId: number, client?: PoolClient) {
        return queryOne<User>(
            `SELECT ${USER_SAFE_SQL} FROM users WHERE telegram_id = $1`,
            [telegramId],
            client
        );
    },

    getUserById(userId: string, client?: PoolClient) {
        return queryOne<User>(
            `SELECT ${USER_SAFE_SQL} FROM users WHERE id = $1`,
            [userId],
            client
        );
    },

    getRewards(client?: PoolClient) {
        return query<Reward>(
            `
      SELECT id, name, description, image_url, required_points, stock
      FROM rewards
      WHERE is_active = true
      ORDER BY required_points DESC
      `,
            [],
            client
        );
    },

    getRedeemedHistory(userId: string, client?: PoolClient) {
        return query<UserPointsHistory>(
            `
      SELECT id, reward_id, points_change, source, description, created_at
      FROM user_points_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
            [userId],
            client
        );
    },

    getUserVolumeByUid(uid: string, client?: PoolClient) {
        return queryOne(
            `
      SELECT uid, total_volume_usd, total_orders
      FROM user_volume_agg
      WHERE uid = $1
      `,
            [uid],
            client
        );
    },

    // =========================
    // INSERT USER
    // =========================
    createUser(user: {
        telegram_id: number;
        telegram_name?: string | null;
        uid: string;
        name?: string;
        role?: string;
        earned_point?: number;
        redeemed_point?: number;
        available_point?: number;
        password_hash: string;
        email?: string | null;
    }, client?: PoolClient) {
        return queryOne<User>(
            `
      INSERT INTO users (
        telegram_id,
        telegram_name,
        uid,
        name,
        role,
        earned_point,
        redeemed_point,
        available_point,
        password_hash,
        email
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING
        id, telegram_id, telegram_name, uid, name, role,
        earned_point, redeemed_point, available_point,
        email, created_at, updated_at
      `,
            [
                user.telegram_id,
                user.telegram_name ?? null,
                user.uid,
                user.name ?? null,
                user.role ?? "user",
                user.earned_point ?? 0,
                user.redeemed_point ?? 0,
                user.available_point ?? 0,
                user.password_hash,
                user.email ?? null
            ],
            client
        );
    },

    updateProfile(
        userId: string,
        payload: {
            name: string;
            email: string | null;
            phone_number: string | null;
            address: string | null;
            uid: string | null;
        },
        client?: PoolClient
    ) {
        return queryOne<User>(
            `
        UPDATE users
        SET
            name = $2,
            email = $3,
            phone_number = $4,
            address = $5,
            uid = $6,
            updated_at = NOW()
        WHERE id = $1
        RETURNING ${USER_SAFE_SQL}
        `,
            [
                userId,
                payload.name,
                payload.email,
                payload.phone_number,
                payload.address,
                payload.uid,
            ],
            client
        );
    },
    // =========================
    // GET USER PASS - CHANGE PASS WORD
    // =========================
    getUserWithPasswordById(
        userId: string,
        client?: PoolClient
    ) {
        return queryOne(
            `
    SELECT ${USER_SAFE_SQL}, password_hash FROM users WHERE id = $1`,
            [userId],
            client
        );
    },

    updatePassword(
        userId: string,
        passwordHash: string,
        client?: PoolClient
    ) {
        return execute(
            `
    UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
            [userId, passwordHash],
            client
        );
    },

    updateAvatar(
        userId: string,
        avatarUrl: string,
        client?: PoolClient
    ) {
        return queryOne<User>(
            `
        UPDATE users
        SET
            avatar_url = $2,
            updated_at = NOW()
        WHERE id = $1
        RETURNING ${USER_SAFE_SQL}
        `,
            [
                userId,
                avatarUrl,
            ],
            client
        );
    },

    // =========================
    // REWARD
    // =========================
    getRewardById(rewardId: string, client?: PoolClient) {
        return queryOne<Reward>(
            `
      SELECT id, name, required_points, stock
      FROM rewards
      WHERE id = $1 AND is_active = true
      `,
            [rewardId],
            client
        );
    },

    decreaseRewardStockSafe(rewardId: string, quantity: number, client: PoolClient) {
        return queryOne(
            `
      UPDATE rewards
      SET stock = stock - $1
      WHERE id = $2 AND stock >= $1
      RETURNING id
      `,
            [quantity, rewardId],
            client
        );
    },

    increaseRewardStockSafe(rewardId: string, quantity: number, client: PoolClient) {
        return queryOne(
            `
      UPDATE rewards
      SET stock = stock + $1
      WHERE id = $2
      RETURNING id
      `,
            [quantity, rewardId],
            client
        );
    },

    // =========================
    // REDEEM REQUEST
    // =========================
    createRedeemRequest(data: {
        user_id: string;
        reward_id: string;
        quantity: number;
        status?: string;
        proof_image?: unknown;
        shipping_info?: unknown;
    }, client: PoolClient) {
        return queryOne<RedeemRequest>(
            `
      INSERT INTO redeem_requests (
        id, user_id, reward_id, quantity, status, proof_image, shipping_info
      )
      VALUES ($1,$2,$3,$4,$5,$6, $7)
      RETURNING *
      `,
            [
                crypto.randomUUID(),
                data.user_id,
                data.reward_id,
                data.quantity,
                data.status ?? "pending",
                JSON.stringify(data.proof_image ?? null),
                JSON.stringify(data.shipping_info ?? null),
            ],
            client
        );
    },

    getRedeemRequest(requestId: string, client?: PoolClient) {
        return queryOne<RedeemRequest>(
            `SELECT * FROM redeem_requests WHERE id = $1`,
            [requestId],
            client
        );
    },

    updateRedeemStatus(
        requestId: string,
        status: string,
        note?: string,
        client?: PoolClient
    ) {
        return execute(
            `
      UPDATE redeem_requests
      SET status = $1,
          admin_note = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
            [status, note ?? null, requestId],
            client
        );
    },

    // =========================
    // HISTORY
    // =========================
    insertPointHistory(data: {
        user_id: string;
        reward_id: string;
        points_change: number;
        source: string;
        description?: string;
    }, client: PoolClient) {
        return queryOne(
            `
      INSERT INTO user_points_history (
        user_id, reward_id, points_change, source, description
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
      `,
            [
                data.user_id,
                data.reward_id,
                data.points_change,
                data.source,
                data.description ?? null,
            ],
            client
        );
    },

    async getRedeemRequests(
        params: {
            status?: string
            page?: number
            limit?: number
        },
        client?: PoolClient
    ) {
        const {
            status = "all",
            page = 1,
            limit = 10,
        } = params

        const offset = (page - 1) * limit

        const values: unknown[] = []
        let whereSql = ""

        if (status !== "all") {
            values.push(status)
            whereSql = `WHERE rr.status = $${values.length}`
        }

        values.push(limit)
        values.push(offset)

        const limitIndex = values.length - 1
        const offsetIndex = values.length

        const items = await query(
            `
        SELECT 
            rr.*, u.uid, u.telegram_id, u.name, u.phone_number, u.email, u.address, r.name as reward_name, r.required_points
        FROM redeem_requests rr
        JOIN users u ON rr.user_id = u.id
        JOIN rewards r ON rr.reward_id = r.id
        ${whereSql}
        ORDER BY rr.created_at DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
        `,
            values,
            client
        )

        // count
        const countValues: unknown[] = []
        let countWhere = ""

        if (status !== "all") {
            countValues.push(status)
            countWhere = `WHERE status = $1`
        }

        const countResult = await queryOne(
            `SELECT COUNT(*)::int as total FROM redeem_requests ${countWhere}`,countValues, client)

        return {
            items,
            total: countResult?.total ?? 0,
            page,
            limit,
        }
    },

    syncEarnedPoints(userId: string, earnedFromVolume: number, client: PoolClient) {
        return queryOne<User>(
            `
        UPDATE users
        SET
            earned_point    = $1,
            available_point = $1 - redeemed_point,
            updated_at      = CURRENT_TIMESTAMP
        WHERE id = $2
          AND earned_point < $1          -- idempotent, chỉ update khi có điểm mới
        RETURNING ${USER_SAFE_SQL}
        `,
            [earnedFromVolume, userId],
            client
        );
    },

// Dùng cho createRequest / rejectRequest — chỉ động vào redeemed_point
    adjustRedeemedPoints(userId: string, delta: number, client: PoolClient) {
        return execute(
            `
        UPDATE users
        SET
            redeemed_point  = redeemed_point + $1,
            available_point = earned_point - (redeemed_point + $1),
            updated_at      = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
            [delta, userId],
            client
        );
    },

// =========================
// ADMIN — REWARD CRUD
// =========================
    createReward(data: {
        name: string;
        description?: string | null;
        image_url?: string | null;
        required_points: number;
        stock: number;
    }, client?: PoolClient) {
        return queryOne<Reward>(
            `
    INSERT INTO rewards (id, name, description, image_url, required_points, stock, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING id, name, description, image_url, required_points, stock
    `,
            [
                crypto.randomUUID(),
                data.name,
                data.description ?? null,
                data.image_url ?? null,
                data.required_points,
                data.stock,
            ],
            client
        );
    },

    updateReward(
        rewardId: string,
        data: {
            name: string;
            description?: string | null;
            image_url?: string | null;
            required_points: number;
            stock: number;
        },
        client?: PoolClient
    ) {
        return queryOne<Reward>(
            `
    UPDATE rewards
    SET
        name            = $2,
        description     = $3,
        image_url       = $4,
        required_points = $5,
        stock           = $6,
        updated_at      = NOW()
    WHERE id = $1
    RETURNING id, name, description, image_url, required_points, stock
    `,
            [
                rewardId,
                data.name,
                data.description ?? null,
                data.image_url ?? null,
                data.required_points,
                data.stock,
            ],
            client
        );
    },

    /** Xoá mềm — không xoá khỏi DB, chỉ ẩn khỏi danh sách */
    deleteReward(rewardId: string, client?: PoolClient) {
        return queryOne(
            `
    UPDATE rewards
    SET is_active = false, updated_at = NOW()
    WHERE id = $1
    RETURNING id
    `,
            [rewardId],
            client
        );
    },
    // =========================
// ADMIN — USERS
// =========================
    async getUsers(
        params: {
            uid?: string
            page?: number
            limit?: number
        },
        client?: PoolClient
    ) {
        const {uid = "", page = 1, limit = 10,} = params

        const offset = (page - 1) * limit

        const values: unknown[] = []
        let whereSql = ""

        if (uid.trim()) {
            values.push(`%${uid.trim()}%`)
            whereSql = `WHERE uid ILIKE $${values.length}`
        }

        values.push(limit)
        values.push(offset)

        const limitIndex = values.length - 1
        const offsetIndex = values.length

        const items = await query<User>(
            `
        SELECT ${USER_SAFE_SQL}
        FROM users
        ${whereSql}
        ORDER BY created_at DESC
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
            countWhere = `WHERE uid ILIKE $1`
        }

        const countResult = await queryOne<{ total: number }>(
            `
        SELECT COUNT(*)::int as total
        FROM users
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

    updateUserAdmin(
        userId: string,
        payload: {
            name: string
            email?: string | null
            phone_number?: string | null
            address?: string | null
            role?: string
            telegram_id?: number | null
        },
        client?: PoolClient
    ) {
        return queryOne<User>(
            `
        UPDATE users
        SET
            name = $2, email = $3, phone_number = $4, address = $5, role = $6, telegram_id= $7, updated_at = NOW()
        WHERE id = $1
        RETURNING ${USER_SAFE_SQL}
        `,
            [
                userId,
                payload.name,
                payload.email ?? null,
                payload.phone_number ?? null,
                payload.address ?? null,
                payload.role ?? "user",
                payload.telegram_id,
            ],
            client
        )
    },

    deleteUser(userId: string, client?: PoolClient) {
        return execute( `DELETE FROM users WHERE id = $1`,  [userId],  client
        )
    },

    createUserByAdmin(data: {
        uid: string
        name: string
        telegram_id: number
        telegram_name?: string | null
        password_hash: string
        role?: string
        email?: string | null
    }, client?: PoolClient) {
        return queryOne<User>(
            `
        INSERT INTO users (
            id,
            telegram_id,
            telegram_name,
            uid,
            name,
            role,
            earned_point,
            redeemed_point,
            available_point,
            password_hash,
            email
        )
        VALUES (
            $1,$2,$3,$4,$5,$6,0,0,0,$7,$8
        )
        RETURNING ${USER_SAFE_SQL}
        `,
            [
                crypto.randomUUID(),
                data.telegram_id,
                data.telegram_name ?? null,
                data.uid,
                data.name,
                data.role ?? "user",
                data.password_hash,
                data.email ?? null,
            ],
            client
        )
    },

    // =========================
// ADMIN STATS
// =========================
    async getApprovedRedeemStats(
        params: {
            page?: number
            limit?: number
        },
        client?: PoolClient
    ) {
        const {
            page = 1,
            limit = 10,
        } = params

        const offset = (page - 1) * limit

        const items = await query(
            `
        SELECT
            rr.id,
            rr.quantity,
            rr.created_at,

            u.uid,
            u.name,
            u.email,
            u.phone_number,

            r.name as reward_name,
            r.required_points

        FROM redeem_requests rr
        JOIN users u
            ON rr.user_id = u.id
        JOIN rewards r
            ON rr.reward_id = r.id

        WHERE rr.status = 'approved'

        ORDER BY rr.created_at DESC

        LIMIT $1
        OFFSET $2
        `,
            [limit, offset],
            client
        )

        const countResult = await queryOne<{
            total: number
        }>(
            `
        SELECT COUNT(*)::int as total
        FROM redeem_requests
        WHERE status = 'approved'
        `,
            [],
            client
        )

        return {
            items,
            total: countResult?.total ?? 0,
            page,
            limit,
        }
    },

};

