"use client"

import { useEffect, useRef, useState } from "react"
import Papa from "papaparse"

interface FamUser {
    uid: string
    email: string | null
    telegram_account: string | null
    discord_account: string | null
    created_at: string
}

interface ImportResult {
    inserted: number
    updated: number
    skipped: number
}

export default function FamUsersTab() {
    const [users, setUsers] = useState<FamUser[]>([])
    const [loading, setLoading] = useState(false)
    const [searchUid, setSearchUid] = useState("")
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [showImport, setShowImport] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [importError, setImportError] = useState("")
    const [fileName, setFileName] = useState("")
    const [editingUser, setEditingUser] = useState<FamUser | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const limit = 10

    // Edit form state
    const [editEmail, setEditEmail] = useState("")
    const [editTelegram, setEditTelegram] = useState("")
    const [editDiscord, setEditDiscord] = useState("")

    // Create form state
    const [createUid, setCreateUid] = useState("")
    const [createEmail, setCreateEmail] = useState("")
    const [createTelegram, setCreateTelegram] = useState("")
    const [createDiscord, setCreateDiscord] = useState("")
    const [createError, setCreateError] = useState("")

    async function loadFamUsers() {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/fam-users?uid=${encodeURIComponent(searchUid)}&page=${page}&limit=${limit}`)
            if (!res.ok) throw new Error("Load failed")
            const data = await res.json()
            setUsers(data.items || [])
            setTotal(data.total || 0)
        } catch (e) {
            console.error("[loadFamUsers]", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFamUsers()
    }, [page, searchUid])

    async function handleSearch() {
        setPage(1)
        await loadFamUsers()
    }

    async function handleDelete(uid: string) {
        const ok = confirm(`Xóa fam user "${uid}"?`)
        if (!ok) return

        try {
            const res = await fetch(`/api/admin/fam-users/${encodeURIComponent(uid)}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Delete failed")
            await loadFamUsers()
        } catch (e) {
            console.error("[deleteFamUser]", e)
            alert("Xóa thất bại")
        }
    }

    function openEditModal(user: FamUser) {
        setEditingUser(user)
        setEditEmail(user.email || "")
        setEditTelegram(user.telegram_account || "")
        setEditDiscord(user.discord_account || "")
        setShowEditModal(true)
    }

    async function handleSaveEdit() {
        if (!editingUser) return
        setCreateError("")
        try {
            const res = await fetch(`/api/admin/fam-users/${encodeURIComponent(editingUser.uid)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: editEmail || null,
                    telegram_account: editTelegram || null,
                    discord_account: editDiscord || null,
                }),
            })
            if (!res.ok) {
                const data = await res.json()
                setCreateError(data.error || "Cập nhật thất bại")
                return
            }
            setShowEditModal(false)
            setEditingUser(null)
            await loadFamUsers()
        } catch (e) {
            console.error("[updateFamUser]", e)
            setCreateError("Cập nhật thất bại")
        }
    }

    function openCreateModal() {
        setCreateUid("")
        setCreateEmail("")
        setCreateTelegram("")
        setCreateDiscord("")
        setCreateError("")
        setShowCreateModal(true)
    }

    async function handleCreateUser() {
        setCreateError("")
        if (!createUid.trim()) {
            setCreateError("UID là bắt buộc")
            return
        }
        try {
            const res = await fetch("/api/admin/fam-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: createUid.trim(),
                    email: createEmail.trim() || null,
                    telegram_account: createTelegram.trim() || null,
                    discord_account: createDiscord.trim() || null,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setCreateError(data.error || "Tạo thất bại")
                return
            }
            setShowCreateModal(false)
            setCreateUid("")
            setCreateEmail("")
            setCreateTelegram("")
            setCreateDiscord("")
            await loadFamUsers()
        } catch (e) {
            console.error("[createFamUser]", e)
            setCreateError("Tạo thất bại")
        }
    }

    function openImportModal() {
        setShowImport(true)
        setImportError("")
        setImportResult(null)
        setFileName("")
    }

    async function handleImportFile() {
        const file = fileRef.current?.files?.[0]
        if (!file) {
            setImportError("Vui lòng chọn file CSV")
            return
        }

        setImportError("")
        setImportResult(null)

        Papa.parse<Record<string, string>>(file, {
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: async (parsed) => {
                try {
                    const res = await fetch("/api/admin/fam-users/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ rows: parsed.data }),
                    })

                    const data = await res.json()
                    if (!res.ok) {
                        setImportError(data.error || "Import thất bại")
                    } else {
                        setImportResult(data)
                    }
                } catch {
                    setImportError("Lỗi kết nối server")
                }
            },
            error: () => {
                setImportError("Không thể đọc file CSV")
            },
        })
    }

    const totalPages = Math.max(1, Math.ceil(total / limit))

    // Smart pagination: show current page +/- 2, with ellipsis
    function getPageNumbers(): (number | string)[] {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        const pages: (number | string)[] = []
        const start = Math.max(1, page - 2)
        const end = Math.min(totalPages, page + 2)

        pages.push(1)
        if (start > 2) pages.push("...")

        for (let i = start; i <= end; i++) {
            pages.push(i)
        }

        if (end < totalPages - 1) pages.push("...")
        pages.push(totalPages)

        return pages
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-2 items-center justify-between flex-nowrap">
                {/* Search group - left side */}
                <div className="flex gap-2 flex-1 min-w-0">
                    <input
                        type="text"
                        placeholder="Tìm theo UID..."
                        value={searchUid}
                        onChange={(e) => setSearchUid(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch()
                        }}
                        className="flex-1 min-w-[200px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                        Tìm kiếm
                    </button>
                </div>

                {/* Action buttons - right side */}
                <div className="flex gap-2 items-center flex-shrink-0">
                    <button
                        onClick={openCreateModal}
                        className="bg-green-500 hover:bg-green text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                        + Thêm mới
                    </button>
                    <button
                        onClick={openImportModal}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                        Import CSV
                    </button>
                </div>

            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[750px]">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-600 w-12 whitespace-nowrap">STT</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">UID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Email</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Telegram</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Discord</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Ngày tạo</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600 w-32 whitespace-nowrap">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-400">
                                        Đang tải...
                                    </td>
                                </tr>
                            )}
                            {!loading && users.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-400">
                                        Chưa có dữ liệu
                                    </td>
                                </tr>
                            )}
                            {!loading && users.map((user, index) => (
                                <tr key={user.uid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{(page - 1) * limit + index + 1}</td>
                                    <td className="px-4 py-3 font-medium max-w-[180px] truncate" title={user.uid}>{user.uid}</td>
                                    <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate" title={user.email || ""}>{user.email || "-"}</td>
                                    <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate" title={user.telegram_account || ""}>{user.telegram_account || "-"}</td>
                                    <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate" title={user.discord_account || ""}>{user.discord_account || "-"}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.uid)}
                                                className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ←
                    </button>

                    {getPageNumbers().map((p, idx) => (
                        <span
                            key={idx}
                            className={typeof p === "string" ? "px-2 text-gray-400 text-xs" : ""}
                        >
                            {typeof p === "string" ? p : (
                                <button
                                    onClick={() => setPage(p)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                        page === p
                                            ? "bg-blue-500 text-white"
                                            : "bg-white hover:bg-gray-50 border border-gray-200"
                                    }`}
                                >
                                    {p}
                                </button>
                            )}
                        </span>
                    ))}

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        →
                    </button>
                </div>
            )}

            {/* Import Modal */}
            {showImport && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Import Fam Users từ CSV</h3>
                        <p className="text-sm text-gray-500">
                            Định dạng CSV: <code className="bg-gray-100 px-1 rounded">email;uid;telegram_account;discord_account</code>
                        </p>

                        {/* File input */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 transition"
                        >
                            <div className="text-3xl mb-2">📥</div>
                            <p className="text-sm text-gray-500">
                                {fileName || "Nhấn để chọn file CSV"}
                            </p>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                            />
                        </div>

                        {/* Error */}
                        {importError && (
                            <div className="bg-red-50 text-red-500 text-[12px] rounded-xl px-4 py-3">
                                {importError}
                            </div>
                        )}

                        {/* Result */}
                        {importResult && (
                            <div className="bg-green-50 rounded-xl px-4 py-3 space-y-1">
                                <p className="text-[12px] text-green-700 font-medium">
                                    Import thành công
                                </p>
                                <p className="text-[12px] text-green-600">
                                    ✅ Thêm mới: <strong>{importResult.inserted}</strong>
                                </p>
                                <p className="text-[12px] text-green-600">
                                    🔄 Cập nhật: <strong>{importResult.updated}</strong>
                                </p>
                                <p className="text-[12px] text-gray-400">
                                    ⏭ Bỏ qua: {importResult.skipped} dòng
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowImport(false); setImportResult(null); setImportError(""); setFileName("") }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleImportFile}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                            >
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Chỉnh sửa Fam User</h3>
                        <p className="text-sm text-gray-500 break-all">UID: {editingUser.uid}</p>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="text"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Email (tùy chọn)"
                            />
                        </div>

                        {/* Telegram */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                            <input
                                type="text"
                                value={editTelegram}
                                onChange={(e) => setEditTelegram(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Telegram account (tùy chọn)"
                            />
                        </div>

                        {/* Discord */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discord</label>
                            <input
                                type="text"
                                value={editDiscord}
                                onChange={(e) => setEditDiscord(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Discord account (tùy chọn)"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowEditModal(false); setEditingUser(null) }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Thêm mới Fam User</h3>

                        {/* UID - required */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                UID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={createUid}
                                onChange={(e) => setCreateUid(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="UID (bắt buộc)"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="text"
                                value={createEmail}
                                onChange={(e) => setCreateEmail(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Email (tùy chọn)"
                            />
                        </div>

                        {/* Telegram */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                            <input
                                type="text"
                                value={createTelegram}
                                onChange={(e) => setCreateTelegram(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Telegram account (tùy chọn)"
                            />
                        </div>

                        {/* Discord */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discord</label>
                            <input
                                type="text"
                                value={createDiscord}
                                onChange={(e) => setCreateDiscord(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Discord account (tùy chọn)"
                            />
                        </div>

                        {/* Error */}
                        {createError && (
                            <div className="bg-red-50 text-red-500 text-[12px] rounded-xl px-4 py-3">
                                {createError}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateUser}
                                className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                            >
                                Tạo mới
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
