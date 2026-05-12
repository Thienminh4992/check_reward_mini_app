"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { registerUser } from "@/app/services/auth";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const telegram_id = searchParams.get("telegram_id");

    const [uid, setUid] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!uid || !name) {
            alert("Nhập đủ thông tin");
            return;
        }

        if (!telegram_id) {
            alert("Thiếu telegram_id");
            return;
        }

        setLoading(true);

        try {
            const res = await registerUser({
                telegram_id: Number(telegram_id),
                telegram_name: "",
                uid,
                name,
            });

            const user_id = res.user.id;

            router.replace(`/home?user_id=${user_id}`);
        } catch (err) {
            console.error(err);
            alert("Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Header />

            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
                    <h1 className="text-2xl font-bold text-center mb-6">
                        Đăng ký tài khoản
                    </h1>

                    <div className="flex flex-col gap-4">
                        <input
                            placeholder="Nhập UID"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                            className="border border-gray-300 p-3 rounded-lg"
                        />

                        <input
                            placeholder="Tên của bạn"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border border-gray-300 p-3 rounded-lg"
                        />

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50"
                        >
                            {loading ? "Đang xử lý..." : "Đăng ký"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}