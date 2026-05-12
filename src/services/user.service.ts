import { withTransaction } from "@/lib/db";
import { famRecordHasVerifiableFields, verifyFamUserMatch } from "@/lib/fam-verify";
import { hashPassword, verifyPassword } from "@/lib/password";
import { userRepository } from "@/lib/repository";
import type { User } from "@/db/schema";
import type { RewardHistoryItem } from "@/types/user";

export type UidPasswordLoginResult =
    | { status: "ok"; user: User }
    | { status: "not_found" }
    | { status: "wrong_password" }
    | { status: "no_password" }
    | { status: "telegram_mismatch" };

export const userService = {
    // =========================
    // AUTH
    // =========================
    async loginWithUidPassword(
        uid: string,
        password: string,
        telegramId: number
    ): Promise<UidPasswordLoginResult> {
        const row = await userRepository.getUserWithPasswordByUid(uid);
        if (!row) {
            return { status: "not_found" };
        }
        if (!row.password_hash) {
            return { status: "no_password" };
        }
        const valid = await verifyPassword(password, row.password_hash);
        if (!valid) {
            return { status: "wrong_password" };
        }
        if (row.telegram_id !== telegramId) {
            return { status: "telegram_mismatch" };
        }
        const { password_hash: _h, ...safe } = row;
        return { status: "ok", user: safe };
    },

    async registerWithFamVerification(payload: {
        telegram_id: number;
        telegram_name: string | null;
        uid: string;
        email: string;
        telegram_account: string;
        discord_account: string;
        password: string;
    }) {
        const uid = payload.uid.trim();

        const byUid = await userRepository.getByUid(uid);
        if (byUid) {
            throw new Error("USER_EXISTS");
        }

        const sameTg = await userRepository.getUserByTelegramId(
            payload.telegram_id
        );
        if (sameTg) {
            throw new Error("TELEGRAM_TAKEN");
        }

        const fam = await userRepository.getFamUserByUid(uid);
        if (!fam) {
            throw new Error("FAM_NOT_FOUND");
        }
        if (!famRecordHasVerifiableFields(fam)) {
            throw new Error("FAM_NOT_VERIFIABLE");
        }
        if (
            !verifyFamUserMatch(fam, {
                email: payload.email,
                telegram_account: payload.telegram_account,
                discord_account: payload.discord_account,
            })
        ) {
            throw new Error("FAM_MISMATCH");
        }

        const password_hash = await hashPassword(payload.password);
        const displayName = payload.telegram_account.trim() || uid;

        return userRepository.createUser({
            telegram_id: payload.telegram_id,
            telegram_name: payload.telegram_name,
            uid,
            name: displayName,
            role: "user",
            earned_point: 0,
            redeemed_point: 0,
            available_point: 0,
            password_hash,
            email: payload.email.trim(),
            telegram_account: payload.telegram_account.trim(),
            discord_account: payload.discord_account.trim(),
        });
    },

    // =========================
    // USER DASHBOARD
    // =========================
    async getDashboard(userId: string) {
        const user = await userRepository.getUserById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        const history = await userRepository.getRedeemedHistory(userId);

        const volume = await userRepository.getUserVolumeByUid(user.uid);

        const reward_history_items: RewardHistoryItem[] = history.map((h) => ({
            id: h.id,
            name: h.description ?? h.source,
            points_change: h.points_change,
            description: h.description ?? "",
            source: h.source,
            status: "",
            icon: "",
        }));

        return {
            user,
            history,
            reward_history_items,
            volume,
        };
    },

    async getRewards() {
        return userRepository.getRewards();
    },

    // =========================
    // CREATE REDEEM REQUEST
    // =========================
    async createRequest(payload: {
        user_id: string;
        reward_id: string;
        quantity: number;
        shipping_info?: unknown;
        proof_image?: unknown;
    }) {
        return withTransaction(async (client) => {
            const user = await userRepository.getUserById(payload.user_id, client);
            if (!user) throw new Error("User not found");

            const reward = await userRepository.getRewardById(payload.reward_id, client);
            if (!reward) throw new Error("Reward not found");

            const requiredPoints = reward.required_points * payload.quantity;

            if (reward.stock < payload.quantity) {
                throw new Error("Reward out of stock");
            }

            if (user.available_point < requiredPoints) {
                throw new Error("Not enough points");
            }

            const stockUpdated = await userRepository.decreaseRewardStockSafe(
                payload.reward_id,
                payload.quantity,
                client
            );

            if (!stockUpdated) {
                throw new Error("Cannot update reward stock");
            }

            await userRepository.updateUserPoints(
                payload.user_id,
                -requiredPoints,
                client
            );

            const request = await userRepository.createRedeemRequest(
                {
                    user_id: payload.user_id,
                    reward_id: payload.reward_id,
                    quantity: payload.quantity,
                    status: "pending",
                    proof_image: payload.proof_image,
                    shipping_info: payload.shipping_info,
                },
                client
            );

            await userRepository.insertPointHistory(
                {
                    user_id: payload.user_id,
                    points_change: -requiredPoints,
                    source: "redeem",
                    description: `Redeemed ${reward.name}`,
                },
                client
            );

            return request;
        });
    },

    // =========================
    // APPROVE REQUEST
    // =========================
    async approveRequest(requestId: string) {
        return withTransaction(async (client) => {
            const request = await userRepository.getRedeemRequest(requestId, client);

            if (!request) throw new Error("Request not found");

            if (request.status !== "pending") {
                throw new Error("Request already processed");
            }

            await userRepository.updateRedeemStatus(
                requestId,
                "approved",
                undefined,
                client
            );

            return {
                success: true,
                message: "Request approved",
            };
        });
    },

    // =========================
    // REJECT REQUEST
    // =========================
    async rejectRequest(requestId: string, reason?: string) {
        return withTransaction(async (client) => {
            const request = await userRepository.getRedeemRequest(requestId, client);

            if (!request) throw new Error("Request not found");

            if (request.status !== "pending") {
                throw new Error("Request already processed");
            }

            const reward = await userRepository.getRewardById(request.reward_id, client);

            if (!reward) throw new Error("Reward not found");

            const refundPoints = reward.required_points * request.quantity;

            await userRepository.updateUserPoints(
                request.user_id,
                refundPoints,
                client
            );

            await userRepository.increaseRewardStockSafe(
                request.reward_id,
                request.quantity,
                client
            );

            await userRepository.updateRedeemStatus(
                requestId,
                "rejected",
                reason,
                client
            );

            await userRepository.insertPointHistory(
                {
                    user_id: request.user_id,
                    points_change: refundPoints,
                    source: "refund",
                    description: `Refund for rejected redeem request`,
                },
                client
            );

            return {
                success: true,
                message: "Request rejected",
            };
        });
    },

    // =========================
    // ADMIN
    // =========================
    async getRedeemRequests(status = "pending") {
        return userRepository.getRedeemRequests(status);
    },
};