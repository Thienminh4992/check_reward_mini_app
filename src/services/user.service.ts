//src/services/user.service.ts
import { withTransaction } from "@/lib/db";
import { famRecordHasVerifiableFields, verifyFamUserMatch } from "@/lib/fam-verify";
import { hashPassword, verifyPassword } from "@/lib/password";
import { userRepository } from "@/lib/repository";
import type { User } from "@/db/schema";
import type { RewardHistoryItem } from "@/types/user";
import {isValidEmail,isValidPhone,} from "@/lib/validators";
import { DatabaseError } from "pg";
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
        return withTransaction(async (client) => {
            const user = await userRepository.getUserById(userId, client);

            if (!user) throw new Error("User not found");

            const [history, volumeData] = await Promise.all([
                userRepository.getRedeemedHistory(userId, client),
                userRepository.getUserVolumeByUid(user.uid, client),
            ]);

            const volume = Math.round(Number(volumeData?.total_volume_usd || 0));

            // Trả về user đã được update từ DB, hoặc user cũ nếu không có delta
            const updatedUser =
                volume > user.earned_point
                    ? (await userRepository.syncEarnedPoints(user.id, volume, client)) ?? user
                    : user;

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
                user: updatedUser,   // ✅ luôn lấy từ DB, không mutate in-memory
                history,
                reward_history_items,
                volume,
            };
        });
    },

// =========================
// CREATE REDEEM REQUEST
// =========================
    async createRequest(payload: {
        user_id: string;
        reward_id: string;
        quantity: number;
    }) {
        return withTransaction(async (client) => {
            const user = await userRepository.getUserById(
                payload.user_id,
                client
            );

            if (!user) {
                throw new Error("User not found");
            }

            const reward = await userRepository.getRewardById(
                payload.reward_id,
                client
            );

            if (!reward) {
                throw new Error("Reward not found");
            }

            const requiredPoints =
                reward.required_points * payload.quantity;

            // Kiểm tra tồn kho
            if (reward.stock < payload.quantity) {
                throw new Error("Reward out of stock");
            }

            // Kiểm tra điểm
            if (user.available_point < requiredPoints) {
                throw new Error("Not enough points");
            }

            // Trừ stock an toàn
            const stockUpdated =
                await userRepository.decreaseRewardStockSafe(
                    payload.reward_id,
                    payload.quantity,
                    client
                );

            if (!stockUpdated) {
                throw new Error("Cannot update reward stock");
            }

            // Trừ điểm user
            await userRepository.adjustRedeemedPoints(
                payload.user_id,
                requiredPoints,   // bỏ dấu âm — hàm mới nhận số dương, tự cộng vào redeemed
                client
            );

            try {
                // Tạo request đổi quà
                const request =
                    await userRepository.createRedeemRequest(
                        {
                            user_id: payload.user_id,
                            reward_id: payload.reward_id,
                            quantity: payload.quantity,
                            status: "pending",
                        },
                        client
                    );

                // Lưu lịch sử điểm
                await userRepository.insertPointHistory(
                    {
                        user_id: payload.user_id,
                        reward_id: payload.reward_id,
                        points_change: -requiredPoints,
                        source: "redeem",
                        description: `Bạn đã yêu cầu đổi ${payload.quantity} ${reward.name}`,
                    },
                    client
                );

                return request;
            } catch (error: unknown) {
                if (
                    error instanceof DatabaseError &&
                    error.code === "23505"
                ) {
                    throw new Error(
                        "Bạn đã đổi quà này rồi"
                    );
                }

                throw error;
            }
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

            await userRepository.insertPointHistory(
                {
                    user_id: request.user_id,
                    reward_id: request.reward_id,
                    points_change: 0,
                    source: "refund",
                    description: `Admin đã chấp nhận yêu cầu đổi quà`,
                },
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

            await userRepository.adjustRedeemedPoints(
                request.user_id,
                -refundPoints,   // âm = hoàn điểm, giảm redeemed_point
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
                    description: `Admin đã từ chối yêu cầu đổi quà`,
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
    async getRedeemRequests(status = "all", page = 1, limit = 10) {
        return userRepository.getRedeemRequests({
            status,
            page,
            limit,
        })
    },


    // =========================
    // REWARD
    // =========================
    async getAvailableRewards() {
        return userRepository.getRewards();
    },

    // =========================
    // REWARDS — ADMIN CRUD
    // =========================
    createReward(data: {
        name: string;
        description?: string | null;
        image_url?: string | null;
        required_points: number;
        stock: number;
    }) {
        return userRepository.createReward(data);
    },

    updateReward(
        rewardId: string,
        data: {
            name: string;
            description?: string | null;
            image_url?: string | null;
            required_points: number;
            stock: number;
        }
    ) {
        return userRepository.updateReward(rewardId, data);
    },

    deleteReward(rewardId: string) {
        return userRepository.deleteReward(rewardId);
    },

    // =========================
    // ADMIN USERS
    // =========================
    async getUsers(
        uid = "",
        page = 1,
        limit = 10
    ) {
        return userRepository.getUsers({
            uid,
            page,
            limit,
        })
    },

    async updateUserAdmin(
        userId: string,
        payload: {
            name: string
            email?: string
            phone_number?: string
            address?: string
            role?: string
            telegram_id?: number
        }
    ) {
        return userRepository.updateUserAdmin(userId, {
            name: payload.name,
            email: payload.email ?? null,
            phone_number: payload.phone_number ?? null,
            address: payload.address ?? null,
            role: payload.role ?? "user",
            telegram_id: payload.telegram_id,
        })
    },

    async deleteUser(userId: string) {
        return userRepository.deleteUser(userId)
    },

    async createUserByAdmin(payload: {
        uid: string
        name: string
        telegram_id: number
        password: string
        role?: string
        email?: string
    }) {
        const exists =
            await userRepository.getByUid(
                payload.uid
            )

        if (exists) {
            throw new Error(
                "UID already exists"
            )
        }

        const password_hash =
            await hashPassword(
                payload.password
            )

        return userRepository.createUserByAdmin(
            {
                uid: payload.uid,
                name: payload.name,
                telegram_id:
                payload.telegram_id,
                telegram_name:
                payload.name,
                password_hash,
                role:
                    payload.role ??
                    "user",
                email:
                    payload.email ??
                    null,
            }
        )
    },
    // =========================
    // ADMIN STATS
    // =========================
    async getApprovedRedeemStats(
        page = 1,
        limit = 10
    ) {
        return userRepository.getApprovedRedeemStats(
            {
                page,
                limit,
            }
        )
    },
};