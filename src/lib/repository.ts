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
  email, phone_number, address,
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
      ORDER BY created_at DESC
      `,
            [],
            client
        );
    },

    getRedeemedHistory(userId: string, client?: PoolClient) {
        return query<UserPointsHistory>(
            `
      SELECT id, points_change, source, description, created_at
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
    // USER POINTS
    // =========================
    updateUserPoints(userId: string, delta: number, client: PoolClient) {
        return execute(
            `
      UPDATE users
      SET available_point = available_point + $1,
          redeemed_point = CASE
              WHEN $1 < 0 THEN redeemed_point + ABS($1)
              ELSE redeemed_point
          END,
          earned_point = CASE
              WHEN $1 > 0 THEN earned_point + $1
              ELSE earned_point
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
            [delta, userId],
            client
        );
    },

    // =========================
    // HISTORY
    // =========================
    insertPointHistory(data: {
        user_id: string;
        points_change: number;
        source: string;
        description?: string;
    }, client: PoolClient) {
        return queryOne(
            `
      INSERT INTO user_points_history (
        user_id, points_change, source, description
      )
      VALUES ($1,$2,$3,$4)
      RETURNING id
      `,
            [
                data.user_id,
                data.points_change,
                data.source,
                data.description ?? null,
            ],
            client
        );
    },

    getRedeemRequests(status: string, client?: PoolClient) {
        return query(
            `
      SELECT 
          rr.*,
          u.telegram_name,
          u.uid,
          r.name as reward_name,
          r.required_points
      FROM redeem_requests rr
      JOIN users u ON rr.user_id = u.id
      JOIN rewards r ON rr.reward_id = r.id
      WHERE rr.status = $1
      ORDER BY rr.created_at DESC
      `,
            [status],
            client
        );
    }
};