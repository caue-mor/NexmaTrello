/**
 * API para limpar notificações inválidas
 * Remove notificações de convites onde o usuário já é membro do board
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST() {
  try {
    const user = await requireAuth();

    // 1. Buscar todas as notificações de INVITE não lidas do usuário
    const inviteNotifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: "INVITE",
        readAt: null,
      },
      select: {
        id: true,
        relatedBoardId: true,
      },
    });

    if (inviteNotifications.length === 0) {
      return NextResponse.json({ ok: true, cleaned: 0 });
    }

    // 2. Verificar quais boards o usuário já é membro
    const boardIds = inviteNotifications
      .map((n) => n.relatedBoardId)
      .filter((id): id is string => id !== null);

    const memberBoards = await prisma.boardMember.findMany({
      where: {
        userId: user.id,
        boardId: { in: boardIds },
      },
      select: {
        boardId: true,
      },
    });

    const memberBoardIds = new Set(memberBoards.map((m) => m.boardId));

    // 3. Filtrar notificações inválidas (convites de boards onde já é membro)
    const invalidNotificationIds = inviteNotifications
      .filter((n) => n.relatedBoardId && memberBoardIds.has(n.relatedBoardId))
      .map((n) => n.id);

    if (invalidNotificationIds.length === 0) {
      return NextResponse.json({ ok: true, cleaned: 0 });
    }

    // 4. Marcar essas notificações como lidas
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: invalidNotificationIds },
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      cleaned: result.count,
    });
  } catch (err) {
    console.error("Cleanup notifications error:", err);
    return NextResponse.json(
      { error: "Erro ao limpar notificações" },
      { status: 500 }
    );
  }
}
