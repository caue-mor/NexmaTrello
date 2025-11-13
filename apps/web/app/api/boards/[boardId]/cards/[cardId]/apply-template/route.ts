import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
// TODO: Habilitar quando modelo Activity for criado no banco de dados
// import { logChecklistCreated } from "@/lib/activity";
import { z } from "zod";

const applyTemplateSchema = z.object({
  templateId: z.string().min(1, "Template ID é obrigatório"),
});

// POST /api/boards/[boardId]/cards/[cardId]/apply-template - Aplicar template ao card
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(params.boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    const body = await req.json();
    const { templateId } = applyTemplateSchema.parse(body);

    // Verificar se o card existe e pertence ao board
    const card = await prisma.card.findFirst({
      where: {
        id: params.cardId,
        boardId: params.boardId,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    // Buscar o template
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o template pertence ao mesmo board
    if (template.boardId !== params.boardId) {
      return NextResponse.json(
        { error: "Template não pertence a este board" },
        { status: 403 }
      );
    }

    // Validar que items é um array
    if (!Array.isArray(template.items)) {
      return NextResponse.json(
        { error: "Template possui formato inválido" },
        { status: 400 }
      );
    }

    // Criar a checklist com os items do template
    const checklist = await prisma.checklist.create({
      data: {
        id: crypto.randomUUID(),
        cardId: params.cardId,
        title: template.name,
        items: {
          create: (template.items as string[]).map((itemContent) => ({
            id: crypto.randomUUID(),
            content: itemContent,
            done: false,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // TODO: Habilitar quando modelo Activity for criado no banco de dados
    // Registrar atividade
    // await logChecklistCreated(
    //   params.boardId,
    //   params.cardId,
    //   user.id,
    //   template.name
    // );

    return NextResponse.json(
      {
        success: true,
        message: "Template aplicado com sucesso",
        checklist,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(
      "POST /api/boards/[boardId]/cards/[cardId]/apply-template error:",
      err
    );
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Acesso negado") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao aplicar template" },
      { status: 500 }
    );
  }
}
