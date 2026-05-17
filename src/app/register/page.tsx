"use client";

import {Suspense, useEffect, useMemo, useState} from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { registerFamAccount } from "@/app/services/auth";

function RegisterContent() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [uid, setUid] = useState("");
    const [telegramAccount, setTelegramAccount] = useState("");
    const [discordAccount, setDiscordAccount] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const initData = useMemo(() => {
        if (typeof window === "undefined") return null;
        return window.Telegram?.WebApp?.initData ?? null;
    }, []);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;

        if (tg) {
            tg.ready();
            tg.expand();
        }
    }, []);

    const handleSubmit = async () => {
        setError(null);

        if (
            !email.trim() ||
            !uid.trim() ||
            !telegramAccount.trim() ||
            !discordAccount.trim() ||
            !password
        ) {
            setError("Vui lòng nhập đủ thông tin");
            return;
        }

        setLoading(true);

        try {
            await registerFamAccount({
                email: email.trim(),
                uid: uid.trim(),
                telegram_account: telegramAccount.trim(),
                discord_account: discordAccount.trim(),
                password,
                initData,
            });

            router.replace("/home");
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Đăng ký thất bại";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Header />

            <div className="flex-1 flex items-center justify-center px-4 pb-28 overflow-y-auto">
                <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg my-6">
                    <h1 className="text-2xl font-bold text-center mb-2">
                        Đăng ký tài khoản
                    </h1>
                    <p className="text-xs text-gray-500 text-center mb-4">
                        Chỉ dùng khi UID chưa có trong hệ thống. Đã có tài khoản?{" "}
                        <button
                            type="button"
                            onClick={() => router.replace("/login")}
                            className="text-blue-600 underline font-medium"
                        >
                            Đăng nhập
                        </button>
                    </p>
                    <p className="text-xs text-gray-500 text-center mb-6">
                        Email BingX, UID, Telegram, Discord và mật khẩu — ít nhất
                        một trong email / Telegram / Discord phải khớp bảng FAM.
                    </p>

                    <div className="flex flex-col gap-3">
                        <input
                            type="email"
                            placeholder="Email đăng ký BingX"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border border-gray-300 p-3 rounded-lg"
                        />

                        <input
                            placeholder="UID"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                            className="border border-gray-300 p-3 rounded-lg"
                        />

                        <input
                            placeholder="Tài khoản Telegram (@username hoặc tên hiển thị)"
                            value={telegramAccount}
                            onChange={(e) => setTelegramAccount(e.target.value)}
                            className="border border-gray-300 p-3 rounded-lg"
                        />

                        <input
                            placeholder="Tài khoản Discord"
                            value={discordAccount}
                            onChange={(e) => setDiscordAccount(e.target.value)}
                            className="border border-gray-300 p-3 rounded-lg"
                        />

                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border border-gray-300 p-3 rounded-lg"
                        />

                        {error && (
                            <p className="text-sm text-red-600 text-center">
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={loading}
                            className="bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50 font-medium"
                        >
                            {loading ? "Đang xử lý..." : "Đăng ký"}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.replace("/login")}
                            className="text-sm text-blue-600 underline text-center"
                        >
                            Quay lại đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="p-6"></div>}>
            <RegisterContent />
        </Suspense>
    );
}
