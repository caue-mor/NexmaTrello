import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { triggerBoardUpdate } from "@/lib/pusher";

export async function POST(
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

        // Atualizar ticket para CLOSED
        const updatedTicket = await prisma.ticket.update({
            where: { id: params.ticketId },
            data: {
                status: "CLOSED",
                closedAt: new Date(),
                history: {
                    create: {
                        userId: user.id,
                        action: "closed",
                        newValue: "Fechado",
                        oldValue: ticket.status,
                    },
                },
            },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
            },
        });

        // Notificações
        await triggerBoardUpdate(ticket.boardId, "ticket:updated", { ticket: updatedTicket });

        return NextResponse.json({ ticket: updatedTicket });
    } catch (err) {
        console.error("Close ticket error:", err);
        return NextResponse.json({ error: "Erro ao fechar ticket" }, { status: 500 });
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
