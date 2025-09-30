import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string; userId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(params.boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    // Check if assignment exists
    const assignee = await prisma.cardAssignee.findUnique({
      where: {
        cardId_userId: {
          cardId: params.cardId,
          userId: params.userId,
        },
      },
    });

    if (!assignee) {
      return NextResponse.json(
        { error: "Atribuição não encontrada" },
        { status: 404 }
      );
    }

    // Remove assignment
    await prisma.cardAssignee.delete({
      where: {
        cardId_userId: {
          cardId: params.cardId,
          userId: params.userId,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove assignee error:", err);
    return NextResponse.json(
      { error: "Erro ao remover atribuição" },
      { status: 500 }
    );
  }
}