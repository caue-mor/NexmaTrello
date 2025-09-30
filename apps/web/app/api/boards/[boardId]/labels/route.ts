import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
import { labelCreateSchema } from "@/lib/validators";

// GET /api/boards/[boardId]/labels - Listar todas as labels do board
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await requireAuth();
    const { boardId } = await params;

    // Verificar acesso ao board (qualquer role pode listar labels)
    await assertBoardRole(boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    const labels = await prisma.label.findMany({
      where: { boardId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    return NextResponse.json(labels);
  } catch (err: any) {
    console.error("GET /api/boards/[boardId]/labels error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Board não encontrado" || err.message === "Acesso negado") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Erro ao buscar labels" },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/labels - Criar nova label
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await requireAuth();
    const { boardId } = await params;

    // Apenas ADMIN e OWNER podem criar labels
    await assertBoardRole(boardId, user.id, ["ADMIN", "OWNER"]);

    const body = await req.json();
    const data = labelCreateSchema.parse(body);

    // Verificar se já existe label com este nome no board
    const existingLabel = await prisma.label.findUnique({
      where: {
        boardId_name: {
          boardId,
          name: data.name,
        },
      },
    });

    if (existingLabel) {
      return NextResponse.json(
        { error: "Já existe uma label com este nome neste board" },
        { status: 409 }
      );
    }

    // Obter o próximo order
    const maxOrderLabel = await prisma.label.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (maxOrderLabel?.order ?? -1) + 1;

    const label = await prisma.label.create({
      data: {
        boardId,
        name: data.name,
        color: data.color,
        order: nextOrder,
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/boards/[boardId]/labels error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Board não encontrado" || err.message === "Acesso negado") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar label" },
      { status: 500 }
    );
  }
}
