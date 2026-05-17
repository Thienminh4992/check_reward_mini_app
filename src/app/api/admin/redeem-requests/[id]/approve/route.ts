import { NextResponse } from "next/server";
import { userService } from "@/services/user.service";

export async function POST(
    _: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const { id } = await context.params;

        await userService.approveRequest(id);

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
                        : "Approve failed",
            },
            {
                status: 500,
            }
        );
    }
}