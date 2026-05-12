"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { loginWithUidPassword } from "@/app/services/auth";

export default function LoginPage() {
    const router = useRouter();
    const [initData, setInitData] = useState<string | null>(null);
    const [uid, setUid] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
        }
        setInitData(tg?.initData ?? null);
    }, []);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch("/api/users/me");
                if (res.ok) {
                    router.replace("/home");
                    return;
                }
            } catch {
                /* giữ tại trang đăng nhập */
            } finally {
                setCheckingSession(false);
            }
        };
        void check();
    }, [router]);

    const handleSubmit = async () => {
        setError(null);
        if (!uid.trim() || !password) {
            setError("Nhập UID và mật khẩu");
            return;
        }

        setLoading(true);
        try {
            const result = await loginWithUidPassword({
                uid: uid.trim(),
                password,
                initData,
            });

            if ("needs_register" in result && result.needs_register) {
                router.replace("/register");
                return;
            }

            if (result.success === true) {
                router.replace("/home");
                return;
            }

            if (result.success === false && "error" in result) {
                setError(result.error);
            }
        } catch {
            setError("Không kết nối được máy chủ");
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Đang kiểm tra phiên...
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Header />

            <div className="flex-1 flex items-center justify-center px-4 pb-28">
                <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
                    <h1 className="text-xl font-bold text-center mb-2">
                        Đăng nhập
                    </h1>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Nhập UID và mật khẩu BingX của bạn
                    </p>

                    <div className="flex flex-col gap-4">
                        <input
                            placeholder="UID"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                            autoComplete="username"
                            className="border border-gray-300 p-3 rounded-lg"
                        />

                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
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
                            {loading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push("/register")}
                            className="text-sm text-blue-600 underline"
                        >
                            Chưa có tài khoản? Đăng ký
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
