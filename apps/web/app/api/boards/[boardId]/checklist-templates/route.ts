import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
import { checklistTemplateCreateSchema } from "@/lib/validators";
import { z } from "zod";

// GET /api/boards/[boardId]/checklist-templates - Listar templates do board
export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(user.id, params.boardId, ["MEMBER", "ADMIN", "OWNER"]);

    const templates = await prisma.checklistTemplate.findMany({
      where: { boardId: params.boardId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (err: any) {
    console.error("GET /api/boards/[boardId]/checklist-templates error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Acesso negado") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/checklist-templates - Criar template
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(user.id, params.boardId, ["MEMBER", "ADMIN", "OWNER"]);

    const body = await req.json();
    const data = checklistTemplateCreateSchema.parse(body);

    // Verificar se o board existe
    const board = await prisma.board.findUnique({
      where: { id: params.boardId },
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board não encontrado" },
        { status: 404 }
      );
    }

    const template = await prisma.checklistTemplate.create({
      data: {
        id: crypto.randomUUID(),
        boardId: params.boardId,
        name: data.name,
        description: data.description,
        items: data.items,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/boards/[boardId]/checklist-templates error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Acesso negado") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar template" },
      { status: 500 }
    );
  }
}
