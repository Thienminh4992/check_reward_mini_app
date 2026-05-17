// components/Header.tsx
import { ArrowLeft } from "lucide-react"

export default function Header() {
    return (
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 pb-10 shadow">
            <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                    <h2 className="font-semibold text-lg">🤖 Ứng đụng đổi quà tặng</h2>
                </div>
            </div>
        </div>
    )
}