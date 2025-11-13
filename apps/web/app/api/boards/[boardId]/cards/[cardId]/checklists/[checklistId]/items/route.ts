import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checklistItemCreateSchema } from "@/lib/validators";
import { assertBoardRole } from "@/lib/rbac";
import { z } from "zod";

export async function POST(
  req: Request,
  { params }: { params: { boardId: string; cardId: string; checklistId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { boardId, checklistId } = params;

    // Check board access
    await assertBoardRole(boardId, user.id);

    const body = await req.json();
    const data = checklistItemCreateSchema.parse(body);

    const item = await prisma.checklistItem.create({
      data: {
        id: crypto.randomUUID(),
        checklistId,
        content: data.content,
      },
    });

    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Create checklist item error:", err);
    return NextResponse.json(
      { error: "Erro ao criar item" },
      { status: 500 }
    );
  }
}