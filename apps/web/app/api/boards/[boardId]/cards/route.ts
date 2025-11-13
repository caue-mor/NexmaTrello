import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cardCreateSchema } from "@/lib/validators";
import { assertBoardRole } from "@/lib/rbac";
import { notifyCardCreated } from "@/lib/pusher";
import { logCardCreated } from "@/lib/activity";
import { z } from "zod";
import { withApiProtection } from "@/lib/api-helpers";

export async function POST(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    // Aplicar proteções (auth, CSRF, rate limit)
    const protection = await withApiProtection(req);
    if (protection.error) return protection.error;
    const { user } = protection;

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

    // Usar transaction para garantir atomicidade de todas as operações
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar card
      const card = await tx.card.create({
        data: {
          id: crypto.randomUUID(),
          boardId,
          columnId: data.columnId,
          title: data.title,
          description: data.description,
          urgency: data.urgency || "MEDIUM",
          dueAt: dueAtDate,
          clientId: data.clientId,
          createdById: user.id,
          updatedAt: new Date(),
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

      // 2. Se um cliente foi vinculado E tem status ONBOARD, criar checklist de onboarding
      if (data.clientId) {
        const client = await tx.client.findUnique({
          where: { id: data.clientId },
          select: { onboardStatus: true },
        });

        // Só cria checklist se o cliente está em processo de ONBOARD
        if (client && client.onboardStatus === "ONBOARD") {
          const onboardingChecklist = await tx.checklist.create({
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
                  {
                    id: crypto.randomUUID(),
                    content:
                      "Drive do cliente com imagens/vídeos e logomarca",
                    done: false,
                  },
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

      // 3. Buscar membros do board para notificações
      const boardMembers = await tx.boardMember.findMany({
        where: {
          boardId,
          userId: { not: user.id }, // Não notificar quem criou
        },
        select: { userId: true },
      });

      // 4. Buscar informações do board
      const board = await tx.board.findUnique({
        where: { id: boardId },
        select: { title: true },
      });

      // 5. Criar notificações para membros
      if (boardMembers.length > 0) {
        const notifications = boardMembers.map((member) => ({
          userId: member.userId,
          type: "ALERT" as const,
          title: "Novo card criado",
          message: `Card "${card.title}" foi criado no board "${board?.title || "Desconhecido"}"`,
          relatedCardId: card.id,
          relatedBoardId: boardId,
        }));

        await tx.notification.createMany({
          data: notifications,
        });
      }

      return { card, board };
    });

    // Trigger real-time update (fora da transaction)
    await notifyCardCreated(boardId, result.card);

    // TODO: Descomentar quando modelo Activity existir no banco
    // await logCardCreated(result.card.id, user.id);

    return NextResponse.json({ card: result.card });
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