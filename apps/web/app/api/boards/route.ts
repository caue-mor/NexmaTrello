import { NextResponse } from "next/server";
import { boardCreateSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  try {
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { isOrgWide: true },
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            userId: true,
          },
        },
        _count: {
          select: {
            columns: true,
            cards: true,
            members: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ boards });
  } catch (err) {
    console.error("Get boards error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar boards" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title } = boardCreateSchema.parse(body);

    // Create board, member, and Finalizado column in a transaction
    const board = await prisma.$transaction(async (tx) => {
      const newBoard = await tx.board.create({
        data: {
          title,
          ownerId: user.id,
        },
      });

      // Add creator as OWNER member
      await tx.boardMember.create({
        data: {
          boardId: newBoard.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      // Criar coluna "Finalizado" automaticamente
      await tx.column.create({
        data: {
          boardId: newBoard.id,
          title: "✅ Finalizado",
          order: 0,
        },
      });

      return newBoard;
    });

    return NextResponse.json({ board });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Create board error:", err);
    return NextResponse.json(
      { error: "Erro ao criar board" },
      { status: 500 }
    );
  }
}