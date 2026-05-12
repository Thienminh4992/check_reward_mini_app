// components/RewardHistory.tsx
import { RewardHistoryItem } from "@/types/user"

export default function RewardHistory({ items }: { items: RewardHistoryItem[] }) {
    return (
        <div className="mx-4 mt-6">
            <h3 className="font-semibold mb-3">🎁 Lịch sử quà đã đổi</h3>

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
                        <div className="text-xl"></div>
                        <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-blue-500">{item.points_change} điểm</p>
                            <p className="text-sm text-orange-500">{item.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}