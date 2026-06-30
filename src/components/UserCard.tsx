"use client";
import {Pencil, History, LogOut, KeyRound} from "lucide-react";
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
        uid: user.uid || "",
    });

    const [changePasswordOpen, setChangePasswordOpen] =
        useState(false);

    const [passwordLoading, setPasswordLoading] =
        useState(false);

    const [passwordForm, setPasswordForm] =
        useState({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

    const [avatarOpen, setAvatarOpen] =
        useState(false);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [avatarLoading, setAvatarLoading] = useState(false);

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

    const handleChangePassword = async () => {
        const {
            currentPassword,
            newPassword,
            confirmPassword,
        } = passwordForm;

        if (!currentPassword.trim()) {
            alert("Vui lòng nhập mật khẩu hiện tại");
            return;
        }

        if (!newPassword.trim()) {
            alert("Vui lòng nhập mật khẩu mới");
            return;
        }

        if (newPassword.length < 6) {
            alert("Mật khẩu mới phải từ 6 ký tự");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp");
            return;
        }

        if (currentPassword === newPassword) {
            alert(
                "Mật khẩu mới phải khác mật khẩu hiện tại"
            );
            return;
        }

        try {
            setPasswordLoading(true);

            const response = await fetch(
                "/api/users/change-password",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Đổi mật khẩu thất bại"
                );
            }

            alert("Đổi mật khẩu thành công");

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setChangePasswordOpen(false);
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Có lỗi xảy ra khi đổi mật khẩu"
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleUploadAvatar = async () => {
        if (!avatarFile) return;

        try {
            setAvatarLoading(true);

            const formData = new FormData();
            formData.append("file", avatarFile);

            const res = await fetch("/api/users/avatar", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Upload thất bại");
            }

            alert("Cập nhật avatar thành công");

            setAvatarOpen(false);
            setAvatarFile(null);
            window.location.reload();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setAvatarLoading(false);
        }
    };

    // ✅ localUser clone (chỉ đổi tên biến, không đổi logic)
    const localUser = user;

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
                            onClick={() => setMenuOpen(prev => !prev)}
                            className="w-14 h-14 overflow-hidden rounded-full bg-blue-500"
                        >
                            {localUser.avatar_url ? (
                                <img
                                    src={localUser.avatar_url}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (localUser.name?.charAt(0) || "U").toUpperCase()
                            )}
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
                                        setAvatarOpen(true);
                                        setMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
                                >
                                    <span>🖼️</span>
                                    <span>Chỉnh sửa avatar</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setChangePasswordOpen(true);
                                        setMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
                                >
                                    <KeyRound size={18} />
                                    <span>Đổi mật khẩu</span>
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
                            Xin chào, {localUser.name}!
                        </p>

                        <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                            {localUser.available_point.toLocaleString()} điểm
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== EDIT MODAL ===== */}
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
                                    setEditOpen(false)
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
                                    value={form.name}
                                    onChange={(e) =>
                                        handleChange(
                                            "name",
                                            e.target.value
                                        )
                                    }
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-500">
                                    UID
                                </label>
                                <input
                                    value={form.uid}
                                    disabled
                                    className="w-full mt-1 border border-gray-200 bg-gray-10 text-gray-500 rounded-lg p-3 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-500">
                                    Telegram ID
                                </label>
                                <input
                                    value={localUser.telegram_id || ""}
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
                                    value={form.email}
                                    onChange={(e) =>
                                        handleChange(
                                            "email",
                                            e.target.value
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
                                    value={form.phone}
                                    onChange={(e) =>
                                        handleChange(
                                            "phone",
                                            e.target.value
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
                                    value={form.address}
                                    onChange={(e) =>
                                        handleChange(
                                            "address",
                                            e.target.value
                                        )
                                    }
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 min-h-[90px]"
                                />
                            </div>

                            <button
                                type="button"
                                disabled={loading}
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

            {/* ===== PASSWORD MODAL ===== */}
            {changePasswordOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold">
                                Đổi mật khẩu
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setChangePasswordOpen(false)
                                }
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleChangePassword();
                            }}
                        >
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Mật khẩu hiện tại
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            currentPassword: e.target.value,
                                        }))
                                    }
                                    className="w-full border border-gray-300 rounded-lg p-3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            newPassword: e.target.value,
                                        }))
                                    }
                                    className="w-full border border-gray-300 rounded-lg p-3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Xác nhận mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            confirmPassword: e.target.value,
                                        }))
                                    }
                                    className="w-full border border-gray-300 rounded-lg p-3"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setChangePasswordOpen(false)
                                    }
                                    className="flex-1 border border-gray-300 rounded-lg p-3"
                                >
                                    Huỷ
                                </button>

                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="flex-1 bg-blue-600 text-white rounded-lg p-3 disabled:opacity-50"
                                >
                                    {passwordLoading
                                        ? "Đang cập nhật..."
                                        : "Đổi mật khẩu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== AVATAR MODAL ===== */}
            {avatarOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void handleUploadAvatar();
                        }}
                        className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold">
                                Chỉnh sửa avatar
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setAvatarOpen(false);
                                    setAvatarFile(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {avatarPreview && (
                            <div className="flex justify-center mb-4">
                                <img
                                    src={avatarPreview}
                                    className="w-28 h-28 rounded-full object-cover border"
                                    alt="preview"
                                />
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setAvatarFile(file);

                                if (file) {
                                    setAvatarPreview(URL.createObjectURL(file));
                                } else {
                                    setAvatarPreview(null);
                                }
                            }}
                        />

                        <div className="flex gap-3 mt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setAvatarOpen(false);
                                    setAvatarFile(null);
                                    setAvatarPreview(null);
                                }}
                                className="flex-1 border border-gray-300 rounded-lg p-3"
                            >
                                Huỷ
                            </button>

                            <button
                                type="submit"
                                disabled={avatarLoading || !avatarFile}
                                className="flex-1 bg-blue-600 text-white rounded-lg p-3 disabled:opacity-50"
                            >
                                {avatarLoading ? "Đang upload..." : "Upload"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}