import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardUpdateSchema } from "@/lib/validators";
import { assertBoardRole } from "@/lib/rbac";
import { z } from "zod";
import { notifyCardUpdated } from "@/lib/pusher";
import { AutomationEngine } from "@/lib/automation-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string; cardId: string }> | { boardId: string; cardId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { boardId, cardId } = resolvedParams;

    // Check board access
    await assertBoardRole(boardId, user.id);

    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        boardId,
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
        // TODO: Descomentar quando modelo Label existir
        // labels: {
        //   include: {
        //     label: true,
        //   },
        // },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (err) {
    console.error("Get card error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar card" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ boardId: string; cardId: string }> | { boardId: string; cardId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { boardId, cardId } = resolvedParams;

    // Check board access
    await assertBoardRole(boardId, user.id);

    const body = await req.json();
    const data = cardUpdateSchema.parse(body);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.urgency !== undefined) updateData.urgency = data.urgency;
    if (data.dueAt !== undefined) updateData.dueAt = data.dueAt ? new Date(data.dueAt) : null;
    if (data.columnId !== undefined) updateData.columnId = data.columnId;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;

    // Buscar card atual para verificar se clientId está mudando
    const currentCard = await prisma.card.findUnique({
      where: { id: cardId, boardId },
      select: { clientId: true, columnId: true, checklists: { select: { title: true } } },
    });

    if (!currentCard) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    // Se está vinculando um cliente pela primeira vez ou mudando cliente
    const isAddingClient = data.clientId && !currentCard.clientId;
    const hasOnboardingChecklist = currentCard.checklists.some(
      (c) => c.title === "OBJETIVOS - Onboarding Digital de Clientes"
    );

    const card = await prisma.card.update({
      where: {
        id: cardId,
        boardId,
      },
      data: updateData,
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
        // TODO: Descomentar quando modelo Label existir
        // labels: {
        //   include: {
        //     label: true,
        //   },
        // },
      },
    });

    // Se um cliente foi vinculado pela primeira vez e não tem checklist de onboarding
    if (isAddingClient && !hasOnboardingChecklist) {
      // Buscar cliente para verificar status
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        select: { onboardStatus: true },
      });

      // Só cria checklist se o cliente está em processo de ONBOARD
      if (client && client.onboardStatus === "ONBOARD") {
        const onboardingChecklist = await prisma.checklist.create({
          data: {
            id: crypto.randomUUID(),
            cardId: card.id,
            title: "OBJETIVOS - Onboarding Digital de Clientes",
            items: {
              create: [
                { id: crypto.randomUUID(), content: "Login e senha Facebook", done: false },
                { id: crypto.randomUUID(), content: "Login e senha Instagram", done: false },
                { id: crypto.randomUUID(), content: "WhatsApp comercial", done: false },
                { id: crypto.randomUUID(), content: "CNPJ", done: false },
                { id: crypto.randomUUID(), content: "Método de pagamento", done: false },
                { id: crypto.randomUUID(), content: "Drive do cliente com imagens/vídeos e logomarca", done: false },
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
    }

    // Disparar evento Pusher para atualização em tempo real
    await notifyCardUpdated(boardId, card);

    // Automation Trigger: CARD_MOVED
    if (data.columnId && currentCard.columnId && data.columnId !== currentCard.columnId) {
      await AutomationEngine.trigger(boardId, "CARD_MOVED", {
        cardId: card.id,
        fromColumnId: currentCard.columnId,
        toColumnId: data.columnId,
      });
    }

    return NextResponse.json({ card });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Update card error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar card" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ boardId: string; cardId: string }> | { boardId: string; cardId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { boardId, cardId } = resolvedParams;

    // Buscar o board para verificar quem é o dono
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: {
        ownerId: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board não encontrado" }, { status: 404 });
    }

    // Apenas o OWNER do board (quem criou o grupo) pode deletar cards
    if (board.ownerId !== user.id) {
      const ownerName = board.owner.name || board.owner.email;
      return NextResponse.json(
        {
          error: "Apenas o dono do board pode deletar cards",
          boardOwner: ownerName
        },
        { status: 403 }
      );
    }

    // Verificar se o card existe no board
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        boardId,
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    await prisma.card.delete({
      where: {
        id: cardId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete card error:", err);
    return NextResponse.json(
      { error: "Erro ao deletar card" },
      { status: 500 }
    );
  }
}