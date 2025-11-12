import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Verificar se a tabela existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Note'
      );
    `;

    // Tentar contar notas
    let noteCount;
    try {
      noteCount = await prisma.note.count();
    } catch (err: any) {
      noteCount = { error: err.message };
    }

    // Verificar Prisma Client models
    const prismaModels = Object.keys((prisma as any)._dmmf?.datamodel?.models || {});

    return NextResponse.json({
      tableExists,
      noteCount,
      prismaModels,
      hasNoteModel: 'note' in prisma,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}
