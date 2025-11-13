import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const noteCreateSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  scope: z.enum(["PERSONAL", "BOARD", "CARD"]),
  boardId: z.string().optional(),
  cardId: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Buscar notas do usuário ou notas de boards/cards que ele tem acesso
    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { userId: user.id, scope: "PERSONAL" },
          {
            scope: "BOARD",
            board: {
              members: {
                some: { userId: user.id },
              },
            },
          },
          {
            scope: "CARD",
            card: {
              board: {
                members: {
                  some: { userId: user.id },
                },
              },
            },
          },
        ],
      },
      include: {
        board: {
          select: {
            id: true,
            title: true,
          },
        },
        card: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(notes);
  } catch (err) {
    console.error("Get notes error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar notas" },
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
    const data = noteCreateSchema.parse(body);

    // Validar acesso se for BOARD ou CARD
    if (data.scope === "BOARD" && data.boardId) {
      const boardAccess = await prisma.boardMember.findFirst({
        where: {
          boardId: data.boardId,
          userId: user.id,
        },
      });

      if (!boardAccess) {
        return NextResponse.json(
          { error: "Sem acesso a este board" },
          { status: 403 }
        );
      }
    }

    if (data.scope === "CARD" && data.cardId) {
      const cardAccess = await prisma.card.findFirst({
        where: {
          id: data.cardId,
          board: {
            members: {
              some: { userId: user.id },
            },
          },
        },
      });

      if (!cardAccess) {
        return NextResponse.json(
          { error: "Sem acesso a este card" },
          { status: 403 }
        );
      }
    }

    const note = await prisma.note.create({
      data: {
        id: crypto.randomUUID(),
        title: data.title,
        content: data.content,
        scope: data.scope,
        userId: user.id,
        boardId: data.boardId || null,
        cardId: data.cardId || null,
        color: data.color || null,
        tags: data.tags || [],
        updatedAt: new Date(),
      },
      include: {
        board: {
          select: {
            id: true,
            title: true,
          },
        },
        card: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Create note error:", err);
    return NextResponse.json(
      { error: "Erro ao criar nota" },
      { status: 500 }
    );
  }
}
