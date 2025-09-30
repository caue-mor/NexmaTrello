import { NextResponse } from "next/server";

/**
 * TODO: Esta API está temporariamente desabilitada porque o modelo Client
 * não existe no banco de dados de produção.
 *
 * Para habilitar:
 * 1. Execute: npx prisma db push
 * 2. Descomente o código abaixo
 */

// import { NextRequest } from "next/server";
// import { prisma } from "@/lib/db";
// import { requireAuth } from "@/lib/auth";
// import { clientCreateSchema } from "@/lib/validators";

// GET /api/clients - Listar todos os clientes
export async function GET() {
  return NextResponse.json(
    { error: "Funcionalidade ainda não implementada no banco de dados" },
    { status: 501 }
  );
}

// TODO: Descomentar quando modelo Client existir
// export async function GET(req: NextRequest) {
//   try {
//     await requireAuth();
//
//     const clients = await prisma.client.findMany({
//       orderBy: { createdAt: "desc" },
//       include: {
//         _count: {
//           select: { cards: true },
//         },
//       },
//     });
//
//     return NextResponse.json(clients);
//   } catch (err: any) {
//     console.error("GET /api/clients error:", err);
//     if (err.message === "Unauthorized") {
//       return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
//     }
//     return NextResponse.json(
//       { error: "Erro ao buscar clientes" },
//       { status: 500 }
//     );
//   }
// }

// POST /api/clients - Criar novo cliente
export async function POST() {
  return NextResponse.json(
    { error: "Funcionalidade ainda não implementada no banco de dados" },
    { status: 501 }
  );
}

// TODO: Descomentar quando modelo Client existir
// export async function POST(req: NextRequest) {
//   try {
//     await requireAuth();
//
//     const body = await req.json();
//     const data = clientCreateSchema.parse(body);
//
//     const client = await prisma.client.create({
//       data: {
//         name: data.name,
//         status: data.status || "NORMAL",
//         lead: data.lead || 0,
//       },
//     });
//
//     return NextResponse.json(client, { status: 201 });
//   } catch (err: any) {
//     console.error("POST /api/clients error:", err);
//     if (err.message === "Unauthorized") {
//       return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
//     }
//     if (err.name === "ZodError") {
//       return NextResponse.json(
//         { error: "Dados inválidos", details: err.errors },
//         { status: 400 }
//       );
//     }
//     return NextResponse.json(
//       { error: "Erro ao criar cliente" },
//       { status: 500 }
//     );
//   }
// }
