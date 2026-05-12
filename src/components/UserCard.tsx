// components/UserCard.tsx
import { User } from "@/types/user"

export default function UserCard({ user }: { user: User }) {
    return (
        <div className="bg-white mx-4 -mt-6 p-4 rounded-2xl shadow relative z-10">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                </div>

                <div className="flex-1">
                    <p className="font-semibold">Xin chào, {user.name}!</p>
                </div>

                <div className="text-xs text-gray-400">UID: {user.uid}</div>
            </div>
        </div>
    )
}