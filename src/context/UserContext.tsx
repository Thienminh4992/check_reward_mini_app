//context/UserContext
"use client"
import {User} from "@/types/user"
import { createContext, useContext, useState, ReactNode } from "react"
import { Dispatch, SetStateAction } from "react"
interface UserContextType {
    user: User | null
    setUser: Dispatch<SetStateAction<User | null>>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (!context) throw new Error("useUser must be used within UserProvider")
    return context
}