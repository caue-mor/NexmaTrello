import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
import { z } from "zod";

const commentCreateSchema = z.object({
  content: z.string().min(1, "Comentário não pode estar vazio"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(params.boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    const body = await req.json();
    const data = commentCreateSchema.parse(body);

    // Verify card belongs to board
    const card = await prisma.card.findFirst({
      where: { id: params.cardId, boardId: params.boardId },
      include: { assignees: true },
    });

    if (!card) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        id: crypto.randomUUID(),
        cardId: params.cardId,
        userId: user.id,
        content: data.content,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notifications for card assignees (except the commenter)
    const assigneeIds = card.assignees
      .map((a) => a.userId)
      .filter((id) => id !== user.id);

    if (assigneeIds.length > 0) {
      await prisma.notification.createMany({
        data: assigneeIds.map((userId) => ({
          userId,
          type: "ALERT",
          title: "Novo comentário",
          message: `${user.name} comentou no card "${card.title}"`,
          relatedCardId: card.id,
        })),
      });
    }

    return NextResponse.json({ comment });
  } catch (err) {
    console.error("Create comment error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar comentário" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(params.boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    const comments = await prisma.comment.findMany({
      where: { cardId: params.cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("Get comments error:", err);
    return NextResponse.json({ error: "Erro ao carregar comentários" }, { status: 500 });
  }
}