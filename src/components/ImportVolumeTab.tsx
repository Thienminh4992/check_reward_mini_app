// src/components/ImportVolumeTab.tsx
"use client"

import Papa from "papaparse"
import { useRef, useState } from "react"

interface ImportResult {
    inserted: number
    skipped: number
}

export default function ImportVolumeTab() {
    const fileRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState("")

    async function handleImport() {
        const file = fileRef.current?.files?.[0]
        if (!file) return setError("Vui lòng chọn file CSV")

        setError("")
        setResult(null)
        setLoading(true)

        Papa.parse<Record<string, string>>(file, {
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: async (parsed) => {
                try {
                    const res = await fetch("/api/admin/import-volume", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            rows: parsed.data,
                        }),
                    })

                    const data = await res.json()
                    if (!res.ok) {
                        setError(data.error ?? "Import thất bại")
                    } else {
                        setResult(data)
                    }
                } catch {
                    setError("Lỗi kết nối server")
                } finally {
                    setLoading(false)
                }
            },
            error: () => {
                setError("Không thể đọc file CSV")
                setLoading(false)
            },
        })
    }

    return (
        <div className="space-y-4">
            {/* Upload file */}
            <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-300 transition"
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
            {error && (
                <div className="bg-red-50 text-red-500 text-[12px] rounded-xl px-4 py-3">
                    {error}
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="bg-green-50 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-[12px] text-green-700 font-medium">
                        Import thành công
                    </p>
                    <p className="text-[12px] text-green-600">
                        ✅ Đã lưu: <strong>{result.inserted}</strong> giao dịch
                    </p>
                    <p className="text-[12px] text-gray-400">
                        ⏭ Bỏ qua: {result.skipped} dòng
                    </p>
                </div>
            )}

            {/* Submit */}
            <button
                onClick={handleImport}
                disabled={loading}
                className={`w-full py-3 rounded-xl text-[12px] font-medium text-white transition
                    ${loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
            >
                {loading ? "Đang xử lý..." : "Import"}
            </button>
        </div>
    )
}
