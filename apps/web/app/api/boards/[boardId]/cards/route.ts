import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardCreateSchema } from "@/lib/validators";
import { assertBoardRole } from "@/lib/rbac";
import { notifyCardCreated } from "@/lib/pusher";
import { z } from "zod";

export async function POST(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { boardId } = params;

    // Check board access
    await assertBoardRole(boardId, user.id);

    const body = await req.json();
    const data = cardCreateSchema.parse(body);

    const card = await prisma.card.create({
      data: {
        boardId,
        columnId: data.columnId,
        title: data.title,
        description: data.description,
        urgency: data.urgency || "MEDIUM",
        dueAt: data.dueAt && data.dueAt.trim() ? new Date(data.dueAt) : null,
        createdById: user.id,
      },
      include: {
        checklists: {
          include: {
            items: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Trigger real-time update
    await notifyCardCreated(boardId, card);

    // Notificar TODOS os membros do board (exceto quem criou)
    const boardMembers = await prisma.boardMember.findMany({
      where: {
        boardId,
        userId: { not: user.id }, // Não notificar quem criou
      },
      select: { userId: true },
    });

    // Buscar informações do board
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { title: true },
    });

    // Criar notificação para cada membro
    const notifications = boardMembers.map((member) => ({
      userId: member.userId,
      type: "ALERT" as const,
      title: "Novo card criado",
      message: `Card "${card.title}" foi criado no board "${board?.title || "Desconhecido"}"`,
      relatedCardId: card.id,
      relatedBoardId: boardId,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({ card });
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Extract first error message from Zod validation
      const firstError = err.errors[0];
      const errorMessage = firstError.message || "Erro de validação";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    console.error("Create card error:", err);
    return NextResponse.json(
      { error: "Erro ao criar card" },
      { status: 500 }
    );
  }
}