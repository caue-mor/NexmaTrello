import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { triggerBoardUpdate, triggerUserNotification } from "@/lib/pusher";

// Schema de validação para criação de ticket
const createTicketSchema = z.object({
    title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
    description: z.string().optional(),
    type: z.enum(["BUG", "FEATURE", "TASK", "SUPPORT", "URGENT"]).default("TASK"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).default("MEDIUM"),
    boardId: z.string(),
    assignedToId: z.string().optional(),
    dueDate: z.string().optional(), // Recebe como string ISO
    estimatedHours: z.number().optional(),
    cardId: z.string().optional(), // Opcional: vincular a um card existente
});

export async function POST(req: Request) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const data = createTicketSchema.parse(body);

        // Verificar acesso ao board
        const board = await prisma.board.findUnique({
            where: { id: data.boardId },
            include: { members: true, owner: true },
        });

        if (!board) {
            return NextResponse.json({ error: "Board não encontrado" }, { status: 404 });
        }

        // Verificar permissão (membro ou dono)
        const isMember = board.members.some((m) => m.userId === user.id);
        const isOwner = board.ownerId === user.id;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: "Sem permissão para criar tickets neste board" }, { status: 403 });
        }

        // Gerar número do ticket (auto-incremento manual para garantir unicidade global ou por board)
        // Aqui faremos global para simplicidade e robustez
        const lastTicket = await prisma.ticket.findFirst({
            orderBy: { ticketNumber: "desc" },
            select: { ticketNumber: true },
        });
        const ticketNumber = (lastTicket?.ticketNumber || 0) + 1;

        // Calcular SLA inicial baseado na prioridade
        let slaDeadline = null;
        const now = new Date();

        switch (data.priority) {
            case "CRITICAL":
                slaDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 horas
                break;
            case "URGENT":
                slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
                break;
            case "HIGH":
                slaDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 horas
                break;
            case "MEDIUM":
                slaDeadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias
                break;
            // LOW não tem SLA obrigatório ou é muito longo
        }

        // Criar o ticket
        const ticket = await prisma.ticket.create({
            data: {
                ticketNumber,
                title: data.title,
                description: data.description,
                type: data.type,
                priority: data.priority,
                status: "OPEN",
                requesterId: user.id,
                boardId: data.boardId,
                assignedToId: data.assignedToId || null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                estimatedHours: data.estimatedHours,
                cardId: data.cardId,
                slaDeadline,

                // Criar entrada inicial no histórico
                history: {
                    create: {
                        userId: user.id,
                        action: "created",
                        newValue: "Ticket criado",
                    },
                },
            },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
            },
        });

        // Notificações
        // 1. Notificar board via Pusher
        await triggerBoardUpdate(data.boardId, "ticket:created", { ticket });

        // 2. Se foi atribuído a alguém, notificar essa pessoa
        if (data.assignedToId && data.assignedToId !== user.id) {
            // Criar notificação no banco
            await prisma.notification.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: data.assignedToId,
                    type: "ALERT",
                    title: `Novo Ticket #${ticket.ticketNumber}`,
                    message: `Você foi atribuído ao ticket: "${ticket.title}"`,
                    relatedBoardId: data.boardId,
                    // TODO: Adicionar relatedTicketId quando o schema suportar ou usar metadata
                },
            });

            // Notificar via Pusher
            await triggerUserNotification(data.assignedToId, {
                type: "TICKET_ASSIGNED",
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber,
                title: ticket.title,
                message: `Você foi atribuído ao ticket #${ticket.ticketNumber}`,
            });
        }

        // 3. Criar evento no Google Calendar se tiver prazo
        try {
            if (ticket.dueDate) {
                // Import dinâmico para evitar ciclo ou erro se lib não estiver pronta
                const { createCalendarEvent } = await import("@/lib/google-calendar");
                await createCalendarEvent(ticket, user.id);
            }
        } catch (calErr) {
            console.error("Failed to sync with calendar:", calErr);
        }

        return NextResponse.json({ ticket });
    } catch (err) {
        console.error("Create ticket error:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: "Erro ao criar ticket" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const boardId = searchParams.get("boardId");
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");
        const assignedToId = searchParams.get("assignedToId");

        const where: any = {};

        if (boardId) {
            // Verificar acesso ao board específico
            await assertBoardAccess(boardId, user.id);
            where.boardId = boardId;
        } else {
            // Buscar tickets de todos os boards que o usuário é membro
            const userBoards = await prisma.board.findMany({
                where: {
                    OR: [
                        { ownerId: user.id },
                        { members: { some: { userId: user.id } } },
                    ],
                },
                select: { id: true },
            });
            const boardIds = userBoards.map((b) => b.id);
            where.boardId = { in: boardIds };
        }

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedToId) where.assignedToId = assignedToId;

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                requester: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
                board: { select: { id: true, title: true } }, // Incluir info do board
                _count: {
                    select: { comments: true, attachments: true },
                },
            },
            orderBy: [
                { priority: "desc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json({ tickets });
    } catch (err) {
        console.error("Get tickets error:", err);
        return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
    }
}

// Helper para verificar acesso (pode ser movido para lib/rbac)
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
