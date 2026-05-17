//admin/page.tsx
"use client"

import { useEffect, useState } from "react"
import Header from "@/components/Header"
import RedeemRequestTable from "@/components/RedeemRequestTable"
import { getRedeemRequests, RedeemRequest } from "@/app/services/admin"

export default function AdminPage() {
    const [items, setItems] = useState<RedeemRequest[]>([])
    const [loading, setLoading] = useState(true)

    const loadData = async () => {
        try {
            const res = await getRedeemRequests("pending")
            setItems(res)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="mx-4 mt-6">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-gray-500">
                        Loading...
                    </div>
                ) : (
                    <RedeemRequestTable items={items} onApproved={loadData} />
                )}
            </div>
        </div>
    )
}