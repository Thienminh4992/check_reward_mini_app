// components/PointsCard.tsx
import { User } from "@/types/user"

export default function PointsCard({ user }: { user: User }) {
    const percent =
        user.earned_point > 0
            ? (user.available_point / user.earned_point) * 100
            : 0
    return (
        <div className="bg-white mx-4 mt-3 p-3 rounded-xl shadow-sm">
            <p className="text-xs text-gray-500">Số điểm hiện có: {user.available_point} Điểm</p>
            <div className="mt-2">
                <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{user.available_point}</span>
                    <span>{user.earned_point}</span>
                </div>

                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
                    <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}