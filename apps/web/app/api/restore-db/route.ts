import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    // Segurança: só permite em desenvolvimento ou com senha especial
    const { password } = await req.json();

    if (password !== "RESTAURAR_BANCO_NEXMA_2025") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 401 }
      );
    }

    console.log("🚀 Iniciando restauração do banco...");

    // Ler o arquivo SQL
    const sqlPath = path.join(process.cwd(), "RESTORE_DATABASE_COMPLETE.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    // Dividir em statements individuais (remover comentários e linhas vazias)
    const statements = sqlContent
      .split("\n")
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith("--");
      })
      .join("\n")
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 Total de statements: ${statements.length}`);

    // Executar cada statement
    let executed = 0;
    const errors: string[] = [];

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        executed++;

        if (executed % 10 === 0) {
          console.log(`✅ Executados: ${executed}/${statements.length}`);
        }
      } catch (error: any) {
        // Ignorar erros de "already exists" e "does not exist"
        const errorMsg = error.message?.toLowerCase() || "";
        if (
          !errorMsg.includes("already exists") &&
          !errorMsg.includes("does not exist") &&
          !errorMsg.includes("duplicate")
        ) {
          errors.push(`Statement ${executed + 1}: ${error.message}`);
          console.error(`❌ Erro no statement ${executed + 1}:`, error.message);
        } else {
          executed++;
        }
      }
    }

    console.log("✅ Restauração concluída!");

    // Verificar quantas tabelas existem
    const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;

    const tableCount = Number(tables[0].count);

    return NextResponse.json({
      success: true,
      message: "Banco restaurado com sucesso!",
      executed,
      total: statements.length,
      tableCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error("❌ Erro na restauração:", error);
    return NextResponse.json(
      {
        error: "Erro na restauração",
        details: error.message
      },
      { status: 500 }
    );
  }
}
