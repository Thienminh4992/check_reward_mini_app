"use client"

import { useState } from "react"
import Header from "@/components/Header"
import RedeemRequestTable from "@/components/RedeemRequestTable"
import UserManagementTable from "@/components/UserManagementTable"
// ─── Tab types ────────────────────────────────────────────────────────────────
type TabId = "redeem" | "users" | "stats" | "import"

interface Tab {
    id: TabId
    label: string
    icon: string
}

const TABS: Tab[] = [
    { id: "redeem", label: "Duyệt quà", icon: "🎁" },
    { id: "users", label: "Người dùng", icon: "👤" },
    { id: "stats", label: "Thống kê", icon: "📊" },
    { id: "import", label: "Import CSV", icon: "📥" },
]

// ─── Placeholder content ─────────────────────────────────────────────────────
function PlaceholderTab({
                            label,
                            icon,
                        }: {
    label: string
    icon: string
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">{icon}</div>

            <p className="text-gray-500 text-base font-medium">
                Chức năng{" "}
                <span className="text-blue-500">
                    {label}
                </span>{" "}
                đang phát triển
            </p>

            <p className="text-gray-400 text-sm mt-1">
                Sẽ sớm được cập nhật trong phiên bản tiếp theo.
            </p>
        </div>
    )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
    const [activeTab, setActiveTab] =
        useState<TabId>("redeem")

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            {/* ── PHẦN 1: Tab navigation ── */}
            <div className="mx-4 mt-4">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                        Tác vụ
                    </p>

                    <div className="grid grid-cols-4 gap-2">
                        {TABS.map((tab) => {
                            const isActive =
                                activeTab === tab.id

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() =>
                                        setActiveTab(tab.id)
                                    }
                                    className={`
                                        flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl
                                        text-xs font-medium transition-all duration-150
                                        ${
                                        isActive
                                            ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200"
                                            : "text-gray-500 hover:bg-gray-50 active:bg-gray-100"
                                    }
                                    `}
                                >
                                    <span className="text-xl">
                                        {tab.icon}
                                    </span>

                                    <span className="text-center leading-tight">
                                        {tab.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── PHẦN 2: Content area ── */}
            <div className="mx-4 mt-3 flex-1 pb-6">
                {activeTab === "redeem" && (
                    <RedeemRequestTable />
                )}

                {activeTab === "users" && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                        <UserManagementTable />
                    </div>
                )}

                {activeTab === "stats" && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                        <PlaceholderTab
                            label="Thống kê"
                            icon="📊"
                        />
                    </div>
                )}

                {activeTab === "import" && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                        <PlaceholderTab
                            label="Import CSV"
                            icon="📥"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}