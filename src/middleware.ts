// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
//
// /**
//  * URL cũ (mini app trước đây): /register?telegram_id=...
//  * Không còn dùng query này — chuyển về /register sạch để tránh bookmark/cache.
//  */
// export function middleware(request: NextRequest) {
//     const url = request.nextUrl.clone();
//
//     if (
//         url.pathname === "/register" &&
//         url.searchParams.has("telegram_id")
//     ) {
//         url.searchParams.delete("telegram_id");
//         return NextResponse.redirect(url);
//     }
//
//     return NextResponse.next();
// }
//
// export const config = {
//     matcher: ["/register"],
// };
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const token =
        req.cookies.get("session_token")?.value;

    const pathname = req.nextUrl.pathname;

    const isAuthPage =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register");

    const isProtected =
        pathname.startsWith("/home");

    // chưa login
    if (!token && isProtected) {
        return NextResponse.redirect(
            new URL("/login", req.url)
        );
    }

    // đã login
    if (token && isAuthPage) {
        return NextResponse.redirect(
            new URL("/home", req.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/home/:path*",
        "/login",
        "/register",
    ],
};