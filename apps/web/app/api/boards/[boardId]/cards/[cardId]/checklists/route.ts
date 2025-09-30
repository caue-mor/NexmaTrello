import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checklistCreateSchema } from "@/lib/validators";
import { assertBoardRole } from "@/lib/rbac";
import { z } from "zod";

export async function POST(
  req: Request,
  { params }: { params: { boardId: string; cardId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { boardId, cardId } = params;

    // Check board access
    await assertBoardRole(boardId, user.id);

    const body = await req.json();
    const data = checklistCreateSchema.parse(body);

    const checklist = await prisma.checklist.create({
      data: {
        cardId,
        title: data.title,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ checklist });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Create checklist error:", err);
    return NextResponse.json(
      { error: "Erro ao criar checklist" },
      { status: 500 }
    );
  }
}