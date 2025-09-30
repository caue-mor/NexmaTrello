import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { columnCreateSchema } from "@/lib/validators";
import { assertBoardRole } from "@/lib/rbac";
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

    // Get next order number
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
    });

    const nextOrder = lastColumn ? lastColumn.order + 1 : 0;

    const column = await prisma.column.create({
      data: {
        boardId,
        title: body.title,
        order: nextOrder,
      },
    });

    // Notificar TODOS os membros do board (exceto quem criou)
    const boardMembers = await prisma.boardMember.findMany({
      where: {
        boardId,
        userId: { not: user.id },
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
      title: "Nova coluna criada",
      message: `Coluna "${column.title}" foi criada no board "${board?.title || "Desconhecido"}"`,
      relatedBoardId: boardId,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({ column });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Create column error:", err);
    return NextResponse.json(
      { error: "Erro ao criar coluna" },
      { status: 500 }
    );
  }
}