import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { templateId, title } = await req.json();

        if (!templateId || !title) {
            return NextResponse.json(
                { error: "Template ID and title are required" },
                { status: 400 }
            );
        }

        const template = await prisma.boardTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Create the board
        const board = await prisma.board.create({
            data: {
                title,
                ownerId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: "OWNER",
                    },
                },
            },
        });

        // Create columns from template
        const columns = template.columns as string[];
        if (Array.isArray(columns)) {
            for (let i = 0; i < columns.length; i++) {
                await prisma.column.create({
                    data: {
                        boardId: board.id,
                        title: columns[i],
                        order: i,
                        isFixed: false, // Templates create flexible columns by default
                    },
                });
            }
        }

        // Create default cards if any
        // TODO: Implement card creation if needed in future

        // Add activity log
        await prisma.activity.create({
            data: {
                boardId: board.id,
                userId: user.id,
                type: "BOARD_UPDATE", // Using closest type
                metadata: {
                    action: "created_from_template",
                    templateTitle: template.title,
                },
            },
        });

        return NextResponse.json({ boardId: board.id });
    } catch (error) {
        console.error("Error creating board from template:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
