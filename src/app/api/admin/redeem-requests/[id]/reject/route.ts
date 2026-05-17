import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/user.service";

export async function POST(
    req: NextRequest,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const { id } = await context.params;

        const body = await req.json();

        await userService.rejectRequest(
            id,
            body.reason
        );

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Reject failed",
            },
            {
                status: 500,
            }
        );
    }
}