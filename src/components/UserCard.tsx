"use client";
import {Pencil, History, LogOut,} from "lucide-react";
import {useEffect, useRef, useState,} from "react";

import { useRouter } from "next/navigation";

import { User } from "@/types/user";

interface Props {
    user: User;
    onOpenHistory: () => void;
}

export default function UserCard({
                                     user,
                                     onOpenHistory,
                                 }: Props) {
    const router = useRouter();

    const [menuOpen, setMenuOpen] =
        useState(false);

    const [editOpen, setEditOpen] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [form, setForm] = useState({
        name: user.name || "",
        email: user.email || "",
        address: user.address || "",
        phone: user.phone || "",
    });

    const menuRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent
        ) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                )
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", {
            method: "POST",
        });

        router.replace("/login");
    };

    const handleChange = (
        key: string,
        value: string
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleUpdateProfile =
        async () => {
            try {
                setLoading(true);

                const res = await fetch(
                    "/api/users/update-profile",
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            form
                        ),
                    }
                );

                if (!res.ok) {
                    throw new Error();
                }

                window.location.reload();
            } catch {
                alert(
                    "Không cập nhật được thông tin"
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <>
            <div className="bg-white mx-4 -mt-6 p-4 rounded-2xl shadow relative z-10 " >
                <div className="flex items-center gap-4">
                    <div
                        className="relative"
                        ref={menuRef}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                setMenuOpen(
                                    !menuOpen
                                )
                            }
                            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold"
                        >
                            {(
                                user.name?.charAt(
                                    0
                                ) || "U"
                            ).toUpperCase()}
                        </button>

                        {menuOpen && (
                            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditOpen(true);
                                        setMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    <Pencil size={18} />
                                    <span>
                                        Chỉnh sửa thông tin
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        onOpenHistory();
                                        setMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
                                >
                                    <History size={18} />
                                    <span>
                                        Lịch sử đổi quà
                                    </span>
                                                        </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleLogout()
                                    }
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition border-t border-gray-100"
                                >
                                    <LogOut size={18} />
                                    <span>Đăng xuất</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-800">
                            Xin chào, {user.name}!
                        </p>

                        <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                            {user.available_point.toLocaleString()} điểm
                        </div>
                    </div>
                </div>

            </div>

            {/* modal */}
            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold">
                                Chỉnh sửa thông tin
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setEditOpen(
                                        false
                                    )
                                }
                                className="text-gray-400"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500">
                                    Họ tên
                                </label>

                                <input
                                    value={
                                        form.name
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleChange(
                                            "name",
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">
                                    Telegram ID
                                </label>

                                <input
                                    value={user.telegram_id || ""}
                                    disabled
                                    className="w-full mt-1 border border-gray-200 bg-gray-10 text-gray-500 rounded-lg p-3 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-500">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={
                                        form.email
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleChange(
                                            "email",
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-500">
                                    Số điện thoại
                                </label>

                                <input
                                    value={
                                        form.phone
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleChange(
                                            "phone",
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-500">
                                    Địa chỉ
                                </label>

                                <textarea
                                    value={
                                        form.address
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleChange(
                                            "address",
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 min-h-[90px]"
                                />
                            </div>

                            <button
                                type="button"
                                disabled={
                                    loading
                                }
                                onClick={() =>
                                    void handleUpdateProfile()
                                }
                                className="w-full bg-blue-600 text-white rounded-lg p-3 font-medium disabled:opacity-50"
                            >
                                {loading
                                    ? "Đang lưu..."
                                    : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}