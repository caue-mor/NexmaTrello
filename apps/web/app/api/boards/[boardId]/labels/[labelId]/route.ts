import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
import { labelUpdateSchema } from "@/lib/validators";

// PUT /api/boards/[boardId]/labels/[labelId] - Atualizar label
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; labelId: string }> }
) {
  try {
    const user = await requireAuth();
    const { boardId, labelId } = await params;

    // Apenas ADMIN e OWNER podem atualizar labels
    await assertBoardRole(boardId, user.id, ["ADMIN", "OWNER"]);

    const body = await req.json();
    const data = labelUpdateSchema.parse(body);

    // Verificar se a label existe e pertence ao board
    const existingLabel = await prisma.label.findFirst({
      where: {
        id: labelId,
        boardId,
      },
    });

    if (!existingLabel) {
      return NextResponse.json(
        { error: "Label não encontrada" },
        { status: 404 }
      );
    }

    // Se está atualizando o nome, verificar se não existe outra label com o mesmo nome
    if (data.name && data.name !== existingLabel.name) {
      const duplicateLabel = await prisma.label.findUnique({
        where: {
          boardId_name: {
            boardId,
            name: data.name,
          },
        },
      });

      if (duplicateLabel) {
        return NextResponse.json(
          { error: "Já existe uma label com este nome neste board" },
          { status: 409 }
        );
      }
    }

    const label = await prisma.label.update({
      where: { id: labelId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.color && { color: data.color }),
        ...(data.order !== undefined && { order: data.order }),
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    return NextResponse.json(label);
  } catch (err: any) {
    console.error("PUT /api/boards/[boardId]/labels/[labelId] error:", err);
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
      { error: "Erro ao atualizar label" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/labels/[labelId] - Deletar label
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; labelId: string }> }
) {
  try {
    const user = await requireAuth();
    const { boardId, labelId } = await params;

    // Apenas ADMIN e OWNER podem deletar labels
    await assertBoardRole(boardId, user.id, ["ADMIN", "OWNER"]);

    // Verificar se a label existe e pertence ao board
    const existingLabel = await prisma.label.findFirst({
      where: {
        id: labelId,
        boardId,
      },
    });

    if (!existingLabel) {
      return NextResponse.json(
        { error: "Label não encontrada" },
        { status: 404 }
      );
    }

    // Deletar a label (CardLabel será deletado em cascata)
    await prisma.label.delete({
      where: { id: labelId },
    });

    return NextResponse.json(
      { message: "Label deletada com sucesso" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/boards/[boardId]/labels/[labelId] error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Board não encontrado" || err.message === "Acesso negado") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Erro ao deletar label" },
      { status: 500 }
    );
  }
}
