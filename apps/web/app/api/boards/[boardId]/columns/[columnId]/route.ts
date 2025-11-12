import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertBoardRole } from "@/lib/rbac";

export async function DELETE(
  req: Request,
  { params }: { params: { boardId: string; columnId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { boardId, columnId } = params;

    // Check if user has OWNER role (only owners can delete columns)
    await assertBoardRole(boardId, user.id, ["OWNER"]);

    // Check if column exists and belongs to this board
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        boardId,
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    if (!column) {
      return NextResponse.json(
        { error: "Coluna não encontrada" },
        { status: 404 }
      );
    }

    // Check if column has cards
    if (column._count.cards > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir coluna com cards. Mova ou exclua os cards primeiro." },
        { status: 400 }
      );
    }

    // Delete the column
    await prisma.column.delete({
      where: { id: columnId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete column error:", err);

    if (err.message === "Acesso negado") {
      return NextResponse.json(
        { error: "Apenas o dono do board pode excluir colunas" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao excluir coluna" },
      { status: 500 }
    );
  }
}
