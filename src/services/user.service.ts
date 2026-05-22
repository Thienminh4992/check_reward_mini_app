import { withTransaction } from "@/lib/db";
import { famRecordHasVerifiableFields, verifyFamUserMatch } from "@/lib/fam-verify";
import { hashPassword, verifyPassword } from "@/lib/password";
import { userRepository } from "@/lib/repository";
import type { User } from "@/db/schema";
import type { RewardHistoryItem } from "@/types/user";
import {isValidEmail,isValidPhone,} from "@/lib/validators";

export type UpdateProfileResult =
    | {status: "ok";user: User;}
    | {status: "invalid_name";}
    | {status: "invalid_email";}
    | {status: "invalid_phone";};

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
        // console.log('loginWithUidPassword', row, 'telegramId', telegramId);
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
        if (String(row.telegram_id) !== String(telegramId)) {
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
            telegram_name: payload.telegram_account.trim(),
            uid,
            name: displayName,
            role: "user",
            earned_point: 0,
            redeemed_point: 0,
            available_point: 0,
            password_hash,
            email: payload.email.trim(),
        });
    },

    async updateProfile(
        userId: string,
        payload: {
            name: string;
            email?: string;
            address?: string;
            phone_number?: string;
        }
    ): Promise<UpdateProfileResult> {
        const name = payload.name?.trim() || "";
        const email = payload.email?.trim() || "";
        const phone = payload.phone_number?.trim() || "";
        const address = payload.address?.trim() || "";

        if (name.length < 2) {
            return { status: "invalid_name" };
        }

        if (email && !isValidEmail(email)) {
            return { status: "invalid_email" };
        }

        if (phone && !isValidPhone(phone)) {
            return { status: "invalid_phone" };
        }

        const user = await userRepository.updateProfile(userId, {
            name,
            email: email || null,
            phone_number: phone || null,
            address: address || null,
        });

        return {
            status: "ok",
            user: user!,
        };
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
        const volumeData = await userRepository.getUserVolumeByUid(user.uid);
        const volume = Math.round(
            Number(volumeData?.total_volume_usd || 0)
        );
        user.earned_point = volume
        user.available_point = user.earned_point - user.redeemed_point;
        console.log("volume", volume);
        console.log("available_point", user.available_point);
        const reward_history_items: RewardHistoryItem[] = history.map((h) => ({
            id: h.id,
            reward_id: h.reward_id,
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

    // async getRewards() {
    //     return userRepository.getRewards();
    // },

    // =========================
    // CREATE REDEEM REQUEST
    // =========================
    async createRequest(payload: {
        user_id: string;
        reward_id: string;
        quantity: number;
    }) {
        return withTransaction(async (client) => {
            const user = await userRepository.getUserById(payload.user_id, client);
            if (!user) throw new Error("User not found");

            const reward = await userRepository.getRewardById(payload.reward_id, client);
            if (!reward) throw new Error("Reward not found");

            const requiredPoints = reward.required_points * payload.quantity;
            console.log("PAYLOAD", payload)
            if (reward.stock < payload.quantity) {
                throw new Error("Reward out of stock");
            }
            // console.log("requiredPoints", requiredPoints, "user.available_point", user.available_point)
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
                },
                client
            );

            await userRepository.insertPointHistory(
                {
                    user_id: payload.user_id,
                    reward_id: payload.reward_id,
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
                    reward_id: request.reward_id,
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