import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { triggerBoardUpdate, triggerUserNotification } from "@/lib/pusher";

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

        // Atualizar ticket para RESOLVED
        const updatedTicket = await prisma.ticket.update({
            where: { id: params.ticketId },
            data: {
                status: "RESOLVED",
                resolvedAt: new Date(),
                history: {
                    create: {
                        userId: user.id,
                        action: "resolved",
                        newValue: "Resolvido",
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

        // Notificar solicitante se não for quem resolveu
        if (ticket.requesterId !== user.id) {
            await prisma.notification.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: ticket.requesterId,
                    type: "ALERT",
                    title: `Ticket Resolvido: #${ticket.ticketNumber}`,
                    message: `Seu ticket "${ticket.title}" foi resolvido!`,
                    relatedBoardId: ticket.boardId,
                },
            });

            await triggerUserNotification(ticket.requesterId, {
                type: "TICKET_RESOLVED",
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber,
                title: ticket.title,
                message: `Seu ticket #${ticket.ticketNumber} foi resolvido`,
            });
        }

        return NextResponse.json({ ticket: updatedTicket });
    } catch (err) {
        console.error("Resolve ticket error:", err);
        return NextResponse.json({ error: "Erro ao resolver ticket" }, { status: 500 });
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
