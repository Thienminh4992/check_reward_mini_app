"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Gift, ShieldCheck } from "lucide-react"
import { useUser } from "@/context/UserContext"

export default function BottomNav() {
    const path = usePathname()
    const { user } = useUser()

    const isActive = (p: string) => path === p

    if (path === "/login" || path === "/register") {
        return null
    }

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full bg-white border-t flex
        justify-around py-2 shadow-md max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-5xl xl:max-w-7xl">

            {/* HOME */}
            <Link
                href="/home"
                className={`flex flex-col items-center ${
                    isActive("/home") ? "text-blue-500" : "text-gray-400"
                } transition-all`}
            >
                <Home size={20} />
                <p className="text-xs">Trang chủ</p>
            </Link>

            {/*/!* REWARD *!/*/}
            {/*<Link*/}
            {/*    href="/reward"*/}
            {/*    className={`flex flex-col items-center ${*/}
            {/*        isActive("/reward") ? "text-blue-500" : "text-gray-400"*/}
            {/*    } transition-all`}*/}
            {/*>*/}
            {/*    <Gift size={20} />*/}
            {/*    <p className="text-xs">Quà tặng</p>*/}
            {/*</Link>*/}

            {user?.role === "admin" && (
                <Link
                    href="/admin"
                    className={`flex flex-col items-center ${
                        isActive("/admin") ? "text-blue-500" : "text-gray-400"
                    } transition-all`}
                >
                    <ShieldCheck size={20} />
                    <p className="text-xs">Admin</p>
                </Link>
            )}

        </div>
    )
}