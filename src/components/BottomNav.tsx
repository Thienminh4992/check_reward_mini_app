"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Gift, ShieldCheck } from "lucide-react"

export default function BottomNav() {
    const path = usePathname()

    const isActive = (p: string) => path === p

    return (
        <div className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around py-2 shadow-md">

            {/* HOME */}
            <Link
                href="/"
                className={`flex flex-col items-center ${
                    isActive("/") ? "text-blue-500" : "text-gray-400"
                } transition-all`}
            >
                <Home size={20} />
                <p className="text-xs">Trang chủ</p>
            </Link>

            {/* REWARD */}
            <Link
                href="/reward"
                className={`flex flex-col items-center ${
                    isActive("/reward") ? "text-blue-500" : "text-gray-400"
                } transition-all`}
            >
                <Gift size={20} />
                <p className="text-xs">Quà tặng</p>
            </Link>

            {/* ADMIN (đổi icon chuẩn hơn) */}
            <Link
                href="/admin"
                className={`flex flex-col items-center ${
                    isActive("/admin/redeem-requests") ? "text-blue-500" : "text-gray-400"
                } transition-all`}
            >
                <ShieldCheck size={20} />
                <p className="text-xs">Admin</p>
            </Link>

        </div>
    )
}