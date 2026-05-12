// components/PointsCard.tsx
import { User } from "@/types/user"

export default function PointsCard({ user }: { user: User }) {
    const percent =
        user.earned_point > 0
            ? (user.redeemed_point / user.earned_point) * 100
            : 0

    return (
        <div className="bg-white mx-4 mt-4 p-5 rounded-2xl shadow">
            <p className="text-sm text-gray-500">Bạn đang có</p>

            <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-500 text-2xl">🪙</span>
                <h2 className="text-2xl font-bold">{user.available_point} Điểm</h2>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>{user.redeemed_point}</span>
                    <span>{user.earned_point}</span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                    <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        </div>
    )
}