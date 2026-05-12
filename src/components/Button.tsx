"use client"

import { ButtonHTMLAttributes } from "react"

type Props = ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({ children, ...props }: Props) {
    return (
        <button
            {...props}
            className="w-full bg-blue-500 text-white py-2 rounded-xl active:scale-95"
        >
            {children}
        </button>
    )
}