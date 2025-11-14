/**
 * Script para verificar usuários no banco de produção
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 Conectando ao banco de dados...\n");

    // Contar total de usuários
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total de usuários: ${totalUsers}\n`);

    if (totalUsers === 0) {
      console.log("⚠️  NENHUM USUÁRIO ENCONTRADO!");
      console.log("➡️  Você precisa criar usuários antes de fazer login.\n");
      console.log("Execute: npm run seed:users-only\n");
      return;
    }

    // Listar os primeiros 10 usuários
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("👥 Usuários cadastrados:\n");
    users.forEach((user, index) => {
      const status = user.isActive ? "✅ Ativo" : "❌ Inativo";
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${status}`);
    });

    console.log("\n✅ Verificação concluída!");
  } catch (error) {
    console.error("❌ Erro ao verificar usuários:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
