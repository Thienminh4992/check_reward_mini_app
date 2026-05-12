import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadForm = new FormData()
        uploadForm.append("file", new Blob([buffer]), file.name)
        uploadForm.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET!)

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: uploadForm
            }
        )

        const data = await res.json()
        console.log("cloudinary response:", data)
        console.log('data.secure_url', data.secure_url)
        return NextResponse.json({
            url: data.secure_url.replace("/upload/", "/upload/f_jpg/")
        })
    } catch (err) {

        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}