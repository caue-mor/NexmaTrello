import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: { ticketId: string } }
) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: params.ticketId },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
        }

        await assertBoardAccess(ticket.boardId, user.id);

        const history = await prisma.ticketHistory.findMany({
            where: { ticketId: params.ticketId },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ history });
    } catch (err) {
        console.error("Get ticket history error:", err);
        return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
    }
}

// Helper function
async function assertBoardAccess(boardId: string, userId: string) {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: { members: true },
    });

    if (!board) throw new Error("Board não encontrado");

    const isMember = board.members.some((m) => m.userId === userId);
    const isOwner = board.ownerId === userId;

    if (!isMember && !isOwner) {
        throw new Error("Sem permissão");
    }
}
