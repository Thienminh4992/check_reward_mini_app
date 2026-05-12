"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [needRegister, setNeedRegister] = useState(false);
    const [uid, setUid] = useState("");
    const [initData, setInitData] = useState("");

    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;

        const data = tg?.initData || "";
        setInitData(data);

        login(data);
    }, []);

    async function login(data: string) {
        const res = await fetch("/api/auth", {
            method: "POST",
            body: JSON.stringify({ initData: data }),
        });

        const result = await res.json();

        if (result.success) {
            router.push("/home");
            return;
        }

        if (result.need_register) {
            setNeedRegister(true);
        }
    }

    async function register() {
        const res = await fetch("/api/auth", {
            method: "POST",
            body: JSON.stringify({
                initData,
                uid,
            }),
        });

        const result = await res.json();

        if (result.success) {
            router.push("/home");
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold">Login</h1>

            {needRegister && (
                <div className="mt-4">
                    <input
                        className="border p-2"
                        placeholder="Enter UID"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                    />

                    <button
                        onClick={register}
                        className="bg-blue-500 text-white px-4 py-2 ml-2"
                    >
                        Register
                    </button>
                </div>
            )}
        </div>
    );
}