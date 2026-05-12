import { withTransaction } from "@/lib/db";
import { userRepository } from "@/lib/repository";

export const userService = {
    // =========================
    // AUTH
    // =========================
    async telegramLogin(telegramId: number) {
        const user = await userRepository.getUserByTelegramId(telegramId);

        if (!user) {
            return {
                exists: false,
                user: null,
            };
        }

        return {
            exists: true,
            user,
        };
    },

    async telegramRegister(payload: {
        telegram_id: number;
        telegram_name?: string;
        uid: string;
        name?: string;
    }) {
        const existed = await userRepository.getUserByTelegramId(payload.telegram_id);

        if (existed) {
            throw new Error("User already exists");
        }

        const user = await userRepository.createUser({
            telegram_id: payload.telegram_id,
            telegram_name: payload.telegram_name,
            uid: payload.uid,
            name: payload.name,
            role: "user",
            earned_point: 0,
            redeemed_point: 0,
            available_point: 0,
        });

        return user;
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

        return {
            user,
            history,
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