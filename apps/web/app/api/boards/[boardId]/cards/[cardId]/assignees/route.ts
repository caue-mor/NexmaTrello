import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
import { z } from "zod";
import { triggerUserNotification, triggerBoardUpdate } from "@/lib/pusher";

const assigneeSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(params.boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    const body = await req.json();
    const data = assigneeSchema.parse(body);

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check if user has access to the board
    const hasAccess = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: params.boardId,
          userId: targetUser.id,
        },
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Usuário não tem acesso a este board" },
        { status: 403 }
      );
    }

    // Check if already assigned
    const existing = await prisma.cardAssignee.findUnique({
      where: {
        cardId_userId: {
          cardId: params.cardId,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Usuário já está atribuído a este card" },
        { status: 409 }
      );
    }

    // Get card details for notification
    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      select: { title: true },
    });

    // Assign user
    await prisma.cardAssignee.create({
      data: {
        cardId: params.cardId,
        userId: targetUser.id,
      },
    });

    // Create notification with card title
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: targetUser.id,
        type: "ALERT",
        title: "Você foi atribuído a um card",
        message: `Card: "${card?.title || "Sem título"}" - Você precisa completar este card.`,
        relatedCardId: params.cardId,
        relatedBoardId: params.boardId,
      },
    });

    // Disparar eventos Pusher para atualização em tempo real
    await triggerUserNotification(targetUser.id, {
      type: "ALERT",
      title: "Você foi atribuído a um card",
      message: `Card: "${card?.title || "Sem título"}"`,
      cardId: params.cardId,
      boardId: params.boardId,
    });

    await triggerBoardUpdate(params.boardId, "card:assigned", {
      cardId: params.cardId,
      userId: targetUser.id,
      userName: targetUser.name || targetUser.email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Assign user error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao atribuir usuário" },
      { status: 500 }
    );
  }
}