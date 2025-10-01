import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardCreateSchema } from "@/lib/validators";
import { assertBoardRole } from "@/lib/rbac";
import { notifyCardCreated } from "@/lib/pusher";
import { logCardCreated } from "@/lib/activity";
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

    // Validar e processar dueAt
    let dueAtDate: Date | null = null;
    if (data.dueAt && data.dueAt.trim()) {
      const parsed = new Date(data.dueAt);
      if (!isNaN(parsed.getTime())) {
        dueAtDate = parsed;
      }
    }

    // TODO: Adicionar cálculo de order quando o campo existir no banco
    // const maxOrderCard = await prisma.card.findFirst({
    //   where: { columnId: data.columnId },
    //   orderBy: { order: 'desc' },
    //   select: { order: true },
    // });
    // const nextOrder = (maxOrderCard?.order ?? -1) + 1;

    const card = await prisma.card.create({
      data: {
        boardId,
        columnId: data.columnId,
        title: data.title,
        description: data.description,
        urgency: data.urgency || "MEDIUM",
        dueAt: dueAtDate,
        clientId: data.clientId,
        createdById: user.id,
        // order: nextOrder, // TODO: Descomentar quando campo existir
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

    // Se um cliente foi vinculado, criar automaticamente checklist de onboarding
    if (data.clientId) {
      const onboardingChecklist = await prisma.checklist.create({
        data: {
          cardId: card.id,
          title: "OBJETIVOS - Onboarding Digital de Clientes",
          items: {
            create: [
              { content: "Login e senha Facebook", done: false },
              { content: "Login e senha Instagram", done: false },
              { content: "WhatsApp comercial", done: false },
              { content: "CNPJ", done: false },
              { content: "Método de pagamento", done: false },
              { content: "Drive do cliente com imagens/vídeos e logomarca", done: false },
            ],
          },
        },
        include: {
          items: true,
        },
      });

      // Adicionar checklist ao card retornado
      card.checklists.push(onboardingChecklist);
    }

    // Trigger real-time update
    await notifyCardCreated(boardId, card);

    // TODO: Descomentar quando modelo Activity existir no banco
    // await logCardCreated(card.id, user.id);

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