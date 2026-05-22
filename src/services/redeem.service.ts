// src/services/redeem.service.ts
import { withTransaction } from "@/lib/db";
import { userRepository } from "@/lib/repository";

export const redeemService = {
    async createRedeemRequest(payload: {
        user_id: string;
        reward_id: string;
        quantity: number;
        shipping_info?: unknown;
        proof_image?: unknown;
    }) {
        return withTransaction(async (client) => {
            // 1. lấy user
            const user = await userRepository.getUserById(payload.user_id, client);
            if (!user) throw new Error("User not found");

            // 2. lấy reward
            const reward = await userRepository.getRewardById(payload.reward_id, client);
            if (!reward) throw new Error("Reward not found");

            // 3. tính điểm cần dùng
            const requiredPoints = reward.required_points * payload.quantity;

            // 4. check stock
            if (reward.stock < payload.quantity) {
                throw new Error("Reward out of stock");
            }

            // 5. check point
            if (user.available_point < requiredPoints) {
                throw new Error("Not enough points");
            }

            // 6. giảm stock
            const stockUpdated = await userRepository.decreaseRewardStockSafe(
                payload.reward_id,
                payload.quantity,
                client
            );

            if (!stockUpdated) {
                throw new Error("Cannot update reward stock");
            }

            // 7. trừ điểm user
            await userRepository.updateUserPoints(
                payload.user_id,
                -requiredPoints,
                client
            );

            // 8. tạo request
            const request = await userRepository.createRedeemRequest(
                {
                    user_id: payload.user_id,
                    reward_id: payload.reward_id,
                    quantity: payload.quantity,
                    status: "pending",
                    // shipping_info: payload.shipping_info,
                    // proof_image: payload.proof_image,
                },
                client
            );

            // 9. ghi lịch sử
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
};