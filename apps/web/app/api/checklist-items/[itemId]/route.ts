import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiProtection } from "@/lib/api-helpers";

export async function PUT(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    // Aplicar proteções (auth, CSRF, rate limit)
    const protection = await withApiProtection(req);
    if (protection.error) return protection.error;
    const { user } = protection;

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
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    const card = itemBefore.checklist.card;
    const boardId = card.board.id;

    // Usar transaction para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar item
      const item = await tx.checklistItem.update({
        where: { id: itemId },
        data: {
          done: body.done,
          doneAt: body.done ? new Date() : null,
        },
      });

      // 2. Se marcou como feito, criar notificações e verificar conclusão
      if (body.done && !itemBefore.done) {
        const currentUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { name: true, email: true },
        });

        const boardMembers = await tx.boardMember.findMany({
          where: {
            boardId,
            userId: { not: user.id },
          },
          select: { userId: true },
        });

        // 3. Criar notificações de tarefa completada
        if (boardMembers.length > 0) {
          const notifications = boardMembers.map((member) => ({
            userId: member.userId,
            type: "ALERT" as const,
            title: "Tarefa completada",
            message: `${currentUser?.name || currentUser?.email || "Alguém"} completou uma tarefa no card "${card.title}"`,
            relatedCardId: card.id,
            relatedBoardId: boardId,
          }));

          await tx.notification.createMany({ data: notifications });
        }

        // 4. Verificar se TODAS as tarefas do card estão completas
        const allItems = card.checklists.flatMap((c) => c.items);
        const allCompleted =
          allItems.length > 0 &&
          allItems.every((item) => (item.id === itemId ? true : item.done));

        let cardMoved = false;

        if (allCompleted) {
          // 5. Buscar coluna "Finalizado"
          const finishedColumn = await tx.column.findFirst({
            where: {
              boardId,
              title: { contains: "Finalizado", mode: "insensitive" },
            },
          });

          if (finishedColumn && card.columnId !== finishedColumn.id) {
            // 6. Mover card para "Finalizado"
            await tx.card.update({
              where: { id: card.id },
              data: {
                columnId: finishedColumn.id,
                completedAt: new Date(),
              },
            });

            cardMoved = true;

            // 7. Notificar todos sobre a conclusão do card
            if (boardMembers.length > 0) {
              const completionNotifications = boardMembers.map((member) => ({
                userId: member.userId,
                type: "ALERT" as const,
                title: "Card finalizado! 🎉",
                message: `Card "${card.title}" foi movido para Finalizado - Todas as tarefas foram completadas!`,
                relatedCardId: card.id,
                relatedBoardId: boardId,
              }));

              await tx.notification.createMany({
                data: completionNotifications,
              });
            }
          }
        }

        return { item, cardMoved };
      }

      return { item, cardMoved: false };
    });

    return NextResponse.json(result);
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
    // Aplicar proteções (auth, CSRF, rate limit)
    const protection = await withApiProtection(req);
    if (protection.error) return protection.error;
    const { user } = protection;

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