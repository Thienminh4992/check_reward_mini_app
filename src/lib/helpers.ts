import { NextResponse } from "next/server";

export function successResponse<T>(
    data: T,
    message = "Success",
    status = 200
) {
    return NextResponse.json(
        {
            success: true,
            message,
            data,
        },
        { status }
    );
}

export function errorResponse(
    message = "Internal server error",
    status = 500,
    error?: unknown
) {
    return NextResponse.json(
        {
            success: false,
            message,
            error: process.env.NODE_ENV === "development" ? error : undefined,
        },
        { status }
    );
}