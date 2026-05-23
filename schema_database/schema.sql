1. Thêm UNIQUE constraint
Sau đó dù spam 100 request:
chỉ 1 request insert thành công
các request còn lại fail ngay tại DB

ALTER TABLE redeem_requests
    ADD CONSTRAINT unique_user_reward
        UNIQUE(user_id, reward_id);
2. Catch duplicate error
code === "23505"
try {
    const request =
        await userRepository.createRedeemRequest(...)
} catch (error: any) {
    if (error.code === "23505") {
        throw new Error(
            "Bạn đã đổi quà này rồi"
        )
    }

    throw error
}

1. insert redeem request
2. trừ stock
3. trừ point
4. insert history