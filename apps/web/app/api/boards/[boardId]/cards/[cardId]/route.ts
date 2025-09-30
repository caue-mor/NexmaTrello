import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardUpdateSchema } from "@/lib/validators";
import { assertBoardRole } from "@/lib/rbac";
import { z } from "zod";

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
      },
    });

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