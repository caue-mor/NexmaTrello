import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
import { checklistTemplateUpdateSchema } from "@/lib/validators";
import { z } from "zod";

// GET /api/boards/[boardId]/checklist-templates/[templateId] - Buscar template específico
export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string; templateId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(params.boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    const template = await prisma.checklistTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o template pertence ao board
    if (template.boardId !== params.boardId) {
      return NextResponse.json(
        { error: "Template não pertence a este board" },
        { status: 403 }
      );
    }

    return NextResponse.json(template);
  } catch (err: any) {
    console.error(
      "GET /api/boards/[boardId]/checklist-templates/[templateId] error:",
      err
    );
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Acesso negado") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Erro ao buscar template" },
      { status: 500 }
    );
  }
}

// PUT /api/boards/[boardId]/checklist-templates/[templateId] - Atualizar template
export async function PUT(
  req: NextRequest,
  { params }: { params: { boardId: string; templateId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(params.boardId, user.id, ["MEMBER", "ADMIN", "OWNER"]);

    // Verificar se o template existe e pertence ao board
    const existingTemplate = await prisma.checklistTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    if (existingTemplate.boardId !== params.boardId) {
      return NextResponse.json(
        { error: "Template não pertence a este board" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = checklistTemplateUpdateSchema.parse(body);

    const template = await prisma.checklistTemplate.update({
      where: { id: params.templateId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.items && { items: data.items }),
      },
    });

    return NextResponse.json(template);
  } catch (err: any) {
    console.error(
      "PUT /api/boards/[boardId]/checklist-templates/[templateId] error:",
      err
    );
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
      { error: "Erro ao atualizar template" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/checklist-templates/[templateId] - Deletar template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string; templateId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(params.boardId, user.id, ["ADMIN", "OWNER"]);

    // Verificar se o template existe e pertence ao board
    const existingTemplate = await prisma.checklistTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    if (existingTemplate.boardId !== params.boardId) {
      return NextResponse.json(
        { error: "Template não pertence a este board" },
        { status: 403 }
      );
    }

    await prisma.checklistTemplate.delete({
      where: { id: params.templateId },
    });

    return NextResponse.json({ success: true, message: "Template deletado com sucesso" });
  } catch (err: any) {
    console.error(
      "DELETE /api/boards/[boardId]/checklist-templates/[templateId] error:",
      err
    );
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.message === "Acesso negado") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Erro ao deletar template" },
      { status: 500 }
    );
  }
}
