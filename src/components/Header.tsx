// components/Header.tsx
import { ArrowLeft } from "lucide-react"

export default function Header() {
    return (
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 pb-10 shadow">
            <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                    <p className="text-xs opacity-80">Welcome!</p>
                    <h1 className="font-semibold text-lg">🤖 Check & Redeem Mini App</h1>
                </div>
            </div>
        </div>
    )
}