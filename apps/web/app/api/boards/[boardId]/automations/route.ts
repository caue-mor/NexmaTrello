import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertBoardRole } from "@/lib/rbac";

export async function GET(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { boardId } = params;
        await assertBoardRole(boardId, user.id);

        const automations = await prisma.automation.findMany({
            where: { boardId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(automations);
    } catch (error) {
        console.error("Error fetching automations:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { boardId } = params;
        await assertBoardRole(boardId, user.id);

        const body = await req.json();
        const { name, triggerType, triggerConfig, actionType, actionConfig } = body;

        if (!name || !triggerType || !actionType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const automation = await prisma.automation.create({
            data: {
                boardId,
                name,
                triggerType,
                triggerConfig: triggerConfig || {},
                actionType,
                actionConfig: actionConfig || {},
            },
        });

        return NextResponse.json(automation);
    } catch (error) {
        console.error("Error creating automation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
