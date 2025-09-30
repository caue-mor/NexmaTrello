import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { itemId } = params;
    const body = await req.json();

    // Buscar informações do item antes de atualizar
    const itemBefore = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: {
          include: {
            card: {
              include: {
                board: { select: { id: true, title: true } },
                column: { select: { id: true, title: true } },
                checklists: {
                  include: { items: true },
                },
              },
            },
          },
        },
      },
    });

    if (!itemBefore) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        done: body.done,
        doneAt: body.done ? new Date() : null,
      },
    });

    const card = itemBefore.checklist.card;
    const boardId = card.board.id;

    // Se marcou como feito, notificar todos os membros do board
    if (body.done && !itemBefore.done) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true },
      });

      const boardMembers = await prisma.boardMember.findMany({
        where: {
          boardId,
          userId: { not: user.id },
        },
        select: { userId: true },
      });

      const notifications = boardMembers.map((member) => ({
        userId: member.userId,
        type: "ALERT" as const,
        title: "Tarefa completada",
        message: `${currentUser?.name || currentUser?.email || "Alguém"} completou uma tarefa no card "${card.title}"`,
        relatedCardId: card.id,
        relatedBoardId: boardId,
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }

      // Verificar se TODAS as tarefas do card estão completas
      const allItems = card.checklists.flatMap((c) => c.items);
      const allCompleted = allItems.length > 0 && allItems.every((item) =>
        item.id === itemId ? true : item.done
      );

      if (allCompleted) {
        // Buscar coluna "Finalizado"
        const finishedColumn = await prisma.column.findFirst({
          where: {
            boardId,
            title: { contains: "Finalizado", mode: "insensitive" },
          },
        });

        if (finishedColumn && card.columnId !== finishedColumn.id) {
          // Mover card para "Finalizado"
          await prisma.card.update({
            where: { id: card.id },
            data: { columnId: finishedColumn.id },
          });

          // Notificar todos sobre a conclusão do card
          const completionNotifications = boardMembers.map((member) => ({
            userId: member.userId,
            type: "ALERT" as const,
            title: "Card finalizado! 🎉",
            message: `Card "${card.title}" foi movido para Finalizado - Todas as tarefas foram completadas!`,
            relatedCardId: card.id,
            relatedBoardId: boardId,
          }));

          if (completionNotifications.length > 0) {
            await prisma.notification.createMany({ data: completionNotifications });
          }
        }
      }
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error("Toggle checklist item error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { itemId } = params;

    await prisma.checklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete checklist item error:", err);
    return NextResponse.json(
      { error: "Erro ao deletar item" },
      { status: 500 }
    );
  }
}