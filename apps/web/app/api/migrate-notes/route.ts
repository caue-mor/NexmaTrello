import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    // Senha de segurança
    if (password !== "APLICAR_NOTES_MIGRATION_2025") {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Lista de comandos SQL a serem executados
    const sqlCommands = [
      // 1. Criar enum NoteScope
      `DO $$ BEGIN
        CREATE TYPE "NoteScope" AS ENUM ('PERSONAL', 'BOARD', 'CARD');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$`,

      // 2. Criar tabela Note
      `CREATE TABLE IF NOT EXISTS "Note" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "scope" "NoteScope" NOT NULL,
        "userId" TEXT NOT NULL,
        "boardId" TEXT,
        "cardId" TEXT,
        "isPinned" BOOLEAN NOT NULL DEFAULT false,
        "tags" TEXT[],
        "color" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
      )`,

      // 3. Criar índices
      `CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Note_boardId_idx" ON "Note"("boardId")`,
      `CREATE INDEX IF NOT EXISTS "Note_cardId_idx" ON "Note"("cardId")`,
      `CREATE INDEX IF NOT EXISTS "Note_scope_idx" ON "Note"("scope")`,
      `CREATE INDEX IF NOT EXISTS "Note_isPinned_idx" ON "Note"("isPinned")`,
      `CREATE INDEX IF NOT EXISTS "Note_createdAt_idx" ON "Note"("createdAt")`,
    ];

    // Executar cada comando separadamente
    let executed = 0;
    for (const sql of sqlCommands) {
      await prisma.$executeRawUnsafe(sql);
      executed++;
    }

    // Adicionar foreign keys (pode falhar se já existirem)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch (err: any) {
      if (!err.message.includes("already exists")) {
        console.warn("FK userId already exists or error:", err.message);
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Note" ADD CONSTRAINT "Note_boardId_fkey"
        FOREIGN KEY ("boardId") REFERENCES "Board"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch (err: any) {
      if (!err.message.includes("already exists")) {
        console.warn("FK boardId already exists or error:", err.message);
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Note" ADD CONSTRAINT "Note_cardId_fkey"
        FOREIGN KEY ("cardId") REFERENCES "Card"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch (err: any) {
      if (!err.message.includes("already exists")) {
        console.warn("FK cardId already exists or error:", err.message);
      }
    }

    // Verificar se a tabela foi criada
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Note'
      );
    `;

    return NextResponse.json({
      success: true,
      message: "Tabela Note criada com sucesso",
      commandsExecuted: executed + 3,
      tableExists,
    });
  } catch (err: any) {
    console.error("Migration error:", err);
    return NextResponse.json(
      {
        error: "Erro ao aplicar migration",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
