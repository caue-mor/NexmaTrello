import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { triggerBoardUpdate, triggerUserNotification } from "@/lib/pusher";

// Schema de atualização
const updateTicketSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    type: z.enum(["BUG", "FEATURE", "TASK", "SUPPORT", "URGENT"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).optional(),
    dueDate: z.string().nullable().optional(),
    estimatedHours: z.number().optional(),
});

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
            include: {
                requester: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
                comments: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { createdAt: "desc" },
                },
                history: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { createdAt: "desc" },
                },
                attachments: true,
                timeEntries: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
        }

        // Verificar acesso
        await assertBoardAccess(ticket.boardId, user.id);

        return NextResponse.json({ ticket });
    } catch (err) {
        console.error("Get ticket error:", err);
        return NextResponse.json({ error: "Erro ao buscar ticket" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { ticketId: string } }
) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const data = updateTicketSchema.parse(body);

        const ticket = await prisma.ticket.findUnique({
            where: { id: params.ticketId },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
        }

        await assertBoardAccess(ticket.boardId, user.id);

        // Preparar dados de atualização e histórico
        const updateData: any = {};
        const historyEntries: any[] = [];

        if (data.title && data.title !== ticket.title) {
            updateData.title = data.title;
            historyEntries.push({
                userId: user.id,
                action: "updated",
                field: "title",
                oldValue: ticket.title,
                newValue: data.title,
            });
        }

        if (data.description !== undefined && data.description !== ticket.description) {
            updateData.description = data.description;
            historyEntries.push({
                userId: user.id,
                action: "updated",
                field: "description",
                oldValue: ticket.description ? "Com descrição" : "Sem descrição",
                newValue: data.description ? "Com descrição" : "Sem descrição",
            });
        }

        if (data.type && data.type !== ticket.type) {
            updateData.type = data.type;
            historyEntries.push({
                userId: user.id,
                action: "updated",
                field: "type",
                oldValue: ticket.type,
                newValue: data.type,
            });
        }

        if (data.priority && data.priority !== ticket.priority) {
            updateData.priority = data.priority;
            historyEntries.push({
                userId: user.id,
                action: "updated",
                field: "priority",
                oldValue: ticket.priority,
                newValue: data.priority,
            });

            // Recalcular SLA se prioridade mudar e ticket estiver aberto
            if (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") {
                const now = new Date();
                let slaDeadline = null;
                switch (data.priority) {
                    case "CRITICAL": slaDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); break;
                    case "URGENT": slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); break;
                    case "HIGH": slaDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); break;
                    case "MEDIUM": slaDeadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); break;
                }
                updateData.slaDeadline = slaDeadline;
            }
        }

        if (data.dueDate !== undefined) {
            const newDate = data.dueDate ? new Date(data.dueDate) : null;
            const oldDate = ticket.dueDate;
            // Comparação simples de datas
            if (newDate?.getTime() !== oldDate?.getTime()) {
                updateData.dueDate = newDate;
                historyEntries.push({
                    userId: user.id,
                    action: "updated",
                    field: "dueDate",
                    oldValue: oldDate ? oldDate.toISOString() : "Sem prazo",
                    newValue: newDate ? newDate.toISOString() : "Sem prazo",
                });
            }
        }

        if (data.estimatedHours !== undefined && data.estimatedHours !== ticket.estimatedHours) {
            updateData.estimatedHours = data.estimatedHours;
            historyEntries.push({
                userId: user.id,
                action: "updated",
                field: "estimatedHours",
                oldValue: ticket.estimatedHours?.toString() || "0",
                newValue: data.estimatedHours?.toString() || "0",
            });
        }

        // Atualizar ticket e criar histórico
        const updatedTicket = await prisma.ticket.update({
            where: { id: params.ticketId },
            data: {
                ...updateData,
                history: {
                    create: historyEntries,
                },
            },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
            },
        });

        // Notificar via Pusher
        await triggerBoardUpdate(ticket.boardId, "ticket:updated", { ticket: updatedTicket });

        // Sincronizar com Google Calendar
        try {
            const { updateCalendarEvent } = await import("@/lib/google-calendar");
            // Se mudou data, título, descrição ou prioridade, atualiza
            if (updateData.dueDate || updateData.title || updateData.description || updateData.priority) {
                await updateCalendarEvent(updatedTicket, user.id);
            }
        } catch (calErr) {
            console.error("Failed to sync with calendar:", calErr);
        }

        return NextResponse.json({ ticket: updatedTicket });
    } catch (err) {
        console.error("Update ticket error:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: "Erro ao atualizar ticket" }, { status: 500 });
    }
}

export async function DELETE(
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
            include: { board: true },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
        }

        // Apenas dono do board ou quem criou pode deletar (ou admin)
        if (ticket.board.ownerId !== user.id && ticket.requesterId !== user.id) {
            return NextResponse.json({ error: "Sem permissão para deletar" }, { status: 403 });
        }

        await prisma.ticket.delete({
            where: { id: params.ticketId },
        });

        // Notificar via Pusher
        await triggerBoardUpdate(ticket.boardId, "ticket:deleted", { ticketId: params.ticketId });

        // Remover do Google Calendar
        try {
            const { deleteCalendarEvent } = await import("@/lib/google-calendar");
            await deleteCalendarEvent(ticket, user.id);
        } catch (calErr) {
            console.error("Failed to sync with calendar:", calErr);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Delete ticket error:", err);
        return NextResponse.json({ error: "Erro ao deletar ticket" }, { status: 500 });
    }
}

// Helper function (duplicada para isolamento, idealmente em lib/rbac)
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
