import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const templates = await prisma.boardTemplate.findMany({
            where: {
                isPublic: true,
            },
            orderBy: {
                category: "asc",
            },
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
