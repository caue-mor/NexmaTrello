import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { triggerBoardUpdate, triggerUserNotification } from "@/lib/pusher";

const assignSchema = z.object({
    userId: z.string().nullable(), // null para desatribuir
});

export async function POST(
    req: Request,
    { params }: { params: { ticketId: string } }
) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const data = assignSchema.parse(body);

        const ticket = await prisma.ticket.findUnique({
            where: { id: params.ticketId },
            include: { assignedTo: true },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
        }

        // Verificar acesso
        await assertBoardAccess(ticket.boardId, user.id);

        // Se for atribuir a alguém, verificar se usuário existe
        let assignedUser = null;
        if (data.userId) {
            assignedUser = await prisma.user.findUnique({
                where: { id: data.userId },
                select: { id: true, name: true, email: true },
            });
            if (!assignedUser) {
                return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
            }
        }

        // Atualizar ticket
        const updatedTicket = await prisma.ticket.update({
            where: { id: params.ticketId },
            data: {
                assignedToId: data.userId,
                status: ticket.status === "OPEN" && data.userId ? "IN_PROGRESS" : ticket.status, // Mudar para IN_PROGRESS se atribuído
                startedAt: ticket.startedAt || (data.userId ? new Date() : null), // Marcar início se primeira atribuição
                history: {
                    create: {
                        userId: user.id,
                        action: data.userId ? "assigned" : "unassigned",
                        newValue: assignedUser ? (assignedUser.name || assignedUser.email) : "Ninguém",
                        oldValue: ticket.assignedTo ? (ticket.assignedTo.name || ticket.assignedTo.email) : "Ninguém",
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

        if (data.userId && data.userId !== user.id) {
            // Notificar usuário atribuído
            await prisma.notification.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: data.userId,
                    type: "ALERT",
                    title: `Atribuição: Ticket #${ticket.ticketNumber}`,
                    message: `Você foi atribuído ao ticket: "${ticket.title}"`,
                    relatedBoardId: ticket.boardId,
                },
            });

            await triggerUserNotification(data.userId, {
                type: "TICKET_ASSIGNED",
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber,
                title: ticket.title,
                message: `Você foi atribuído ao ticket #${ticket.ticketNumber}`,
            });
        }

        return NextResponse.json({ ticket: updatedTicket });
    } catch (err) {
        console.error("Assign ticket error:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: "Erro ao atribuir ticket" }, { status: 500 });
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
