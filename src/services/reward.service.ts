// src/services/reward.service.ts
import { userRepository } from "@/lib/repository";

export const rewardService = {
    async getAvailableRewards() {
        return userRepository.getRewards();
    },
};