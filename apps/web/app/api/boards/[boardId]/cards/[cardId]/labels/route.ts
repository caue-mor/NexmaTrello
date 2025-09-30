import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
// TODO: Habilitar quando modelo Activity for criado no banco de dados
// import { logLabelAdded, logLabelRemoved } from "@/lib/activity";
import { z } from "zod";

const addLabelSchema = z.object({
  labelId: z.string().min(1, "labelId é obrigatório"),
});

// POST /api/boards/[boardId]/cards/[cardId]/labels - Adicionar label ao card
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; cardId: string }> }
) {
  try {
    const user = await requireAuth();
    const { boardId, cardId } = await params;

    // Verificar acesso ao board (qualquer membro pode adicionar labels)
    await assertBoardRole(boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    const body = await req.json();
    const { labelId } = addLabelSchema.parse(body);

    // Verificar se o card existe e pertence ao board
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        boardId,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se a label existe e pertence ao board
    const label = await prisma.label.findFirst({
      where: {
        id: labelId,
        boardId,
      },
    });

    if (!label) {
      return NextResponse.json(
        { error: "Label não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a label já está associada ao card
    const existingCardLabel = await prisma.cardLabel.findUnique({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });

    if (existingCardLabel) {
      return NextResponse.json(
        { error: "Label já está associada a este card" },
        { status: 409 }
      );
    }

    // Criar associação
    await prisma.cardLabel.create({
      data: {
        cardId,
        labelId,
      },
    });

    // TODO: Habilitar quando modelo Activity for criado no banco de dados
    // Log da atividade
    // await logLabelAdded(boardId, cardId, user.id, label.name, label.color);

    // Buscar card atualizado com labels
    const updatedCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCard, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/boards/[boardId]/cards/[cardId]/labels error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Board não encontrado" || err.message === "Acesso negado") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao adicionar label ao card" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/cards/[cardId]/labels?labelId=xxx - Remover label do card
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; cardId: string }> }
) {
  try {
    const user = await requireAuth();
    const { boardId, cardId } = await params;

    // Verificar acesso ao board (qualquer membro pode remover labels)
    await assertBoardRole(boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    // Obter labelId da query string
    const { searchParams } = new URL(req.url);
    const labelId = searchParams.get("labelId");

    if (!labelId) {
      return NextResponse.json(
        { error: "labelId é obrigatório na query string" },
        { status: 400 }
      );
    }

    // Verificar se o card existe e pertence ao board
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        boardId,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se a label existe e pertence ao board
    const label = await prisma.label.findFirst({
      where: {
        id: labelId,
        boardId,
      },
    });

    if (!label) {
      return NextResponse.json(
        { error: "Label não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a associação existe
    const cardLabel = await prisma.cardLabel.findUnique({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });

    if (!cardLabel) {
      return NextResponse.json(
        { error: "Label não está associada a este card" },
        { status: 404 }
      );
    }

    // Remover associação
    await prisma.cardLabel.delete({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });

    // TODO: Habilitar quando modelo Activity for criado no banco de dados
    // Log da atividade
    // await logLabelRemoved(boardId, cardId, user.id, label.name);

    // Buscar card atualizado com labels
    const updatedCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCard, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/boards/[boardId]/cards/[cardId]/labels error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Board não encontrado" || err.message === "Acesso negado") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Erro ao remover label do card" },
      { status: 500 }
    );
  }
}
