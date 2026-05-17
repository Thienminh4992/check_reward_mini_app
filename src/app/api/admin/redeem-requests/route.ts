import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/user.service";

export async function GET(req: NextRequest) {
    try {
        const status =
            req.nextUrl.searchParams.get("status") || "pending";

        const items =
            await userService.getRedeemRequests(status);

        return NextResponse.json(items);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}