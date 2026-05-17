//context/UserContext
"use client"
import {User} from "@/types/user"
import { Dispatch, SetStateAction } from "react"
import {createContext,  useContext,  useState,  ReactNode,  useMemo,} from "react"
interface UserContextType {
    user: User | null
    setUser: Dispatch<SetStateAction<User | null>>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const value = useMemo(
        () => ({
            user,
            setUser,
        }),
        [user]
    )
    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (!context) throw new Error("useUser must be used within UserProvider")
    return context
}