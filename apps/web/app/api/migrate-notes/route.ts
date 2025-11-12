import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

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

    // Ler o arquivo SQL
    const sqlFilePath = path.join(process.cwd(), "CREATE_NOTES_TABLE.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf-8");

    // Executar o SQL completo de uma vez
    await prisma.$executeRawUnsafe(sqlContent);

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
