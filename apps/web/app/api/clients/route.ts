import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { clientCreateSchema } from "@/lib/validators";

// GET /api/clients - Listar todos os clientes
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    return NextResponse.json(clients);
  } catch (err: any) {
    console.error("GET /api/clients error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Criar novo cliente
export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const data = clientCreateSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        status: data.status || "NORMAL",
        lead: data.lead || 0,
        lastContact: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/clients error:", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
