import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> | { boardId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { boardId } = resolvedParams;

    // Buscar o board para verificar quem é o dono
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: {
        ownerId: true,
        owner: {
          select: { name: true, email: true },
        },
        title: true,
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board não encontrado" }, { status: 404 });
    }

    // Apenas o OWNER (admin que criou) pode deletar o board
    if (board.ownerId !== user.id) {
      const ownerName = board.owner.name || board.owner.email;
      return NextResponse.json(
        {
          error: "Apenas o administrador que criou o grupo pode excluí-lo",
          boardOwner: ownerName,
        },
        { status: 403 }
      );
    }

    // Deletar o board (cascade vai deletar tudo relacionado)
    await prisma.board.delete({
      where: { id: boardId },
    });

    return NextResponse.json({
      ok: true,
      message: `Board "${board.title}" excluído com sucesso`
    });
  } catch (err) {
    console.error("Delete board error:", err);
    return NextResponse.json(
      { error: "Erro ao excluir board" },
      { status: 500 }
    );
  }
}