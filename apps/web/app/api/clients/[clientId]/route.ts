import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { clientUpdateSchema } from "@/lib/validators";

// GET /api/clients/[clientId] - Buscar cliente específico com cards
export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    await requireAuth();

    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      include: {
        cards: {
          include: {
            column: {
              select: {
                id: true,
                title: true,
              },
            },
            checklists: {
              include: {
                items: {
                  select: {
                    id: true,
                    content: true,
                    done: true,
                  },
                },
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
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (err: any) {
    console.error("GET /api/clients/[clientId] error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erro ao buscar cliente" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[clientId] - Atualizar cliente
export async function PUT(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    await requireAuth();

    const body = await req.json();
    const data = clientUpdateSchema.parse(body);

    const client = await prisma.client.update({
      where: { id: params.clientId },
      data,
    });

    return NextResponse.json(client);
  } catch (err: any) {
    console.error("PUT /api/clients/[clientId] error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.code === "P2025") {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[clientId] - Deletar cliente
export async function DELETE(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    await requireAuth();

    await prisma.client.delete({
      where: { id: params.clientId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/clients/[clientId] error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.code === "P2025") {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao deletar cliente" },
      { status: 500 }
    );
  }
}
