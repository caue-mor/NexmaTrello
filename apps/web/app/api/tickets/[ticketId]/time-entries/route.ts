import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const timeEntrySchema = z.object({
    hours: z.number().min(0.1, "Mínimo de 0.1 horas"),
    description: z.string().optional(),
    date: z.string().optional(), // ISO string
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
        const data = timeEntrySchema.parse(body);

        const ticket = await prisma.ticket.findUnique({
            where: { id: params.ticketId },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
        }

        await assertBoardAccess(ticket.boardId, user.id);

        // Criar entrada de tempo
        const timeEntry = await prisma.timeEntry.create({
            data: {
                ticketId: params.ticketId,
                userId: user.id,
                hours: data.hours,
                description: data.description,
                date: data.date ? new Date(data.date) : new Date(),
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        // Atualizar total de horas no ticket
        await prisma.ticket.update({
            where: { id: params.ticketId },
            data: {
                actualHours: {
                    increment: data.hours,
                },
            },
        });

        return NextResponse.json({ timeEntry });
    } catch (err) {
        console.error("Create time entry error:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: "Erro ao registrar horas" }, { status: 500 });
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
