"use client"

import { useEffect, useState } from "react"
import Header from "@/components/Header"
import RewardList from "@/components/RewardList"
import { getRewards } from "@/app/services/reward"
import { Reward } from "@/types/reward"

export default function RewardPage() {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const cached = sessionStorage.getItem("rewards")

                if (cached) {
                    setRewards(JSON.parse(cached))
                    return
                }

                const data = await getRewards()
                setRewards(data)

                sessionStorage.setItem("rewards", JSON.stringify(data))
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchRewards()
    }, [])

    // if (loading) return <div>Loading...</div>

    return (
        <div>
            <Header />
            <RewardList
                rewards={rewards}
                redeemedRewardIds={new Set()}
            />
        </div>
    )
}