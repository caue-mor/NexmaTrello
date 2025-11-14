import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 Verificando usuários inativos...\n");

    // Buscar todos os usuários
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    console.log(`Total de usuários: ${allUsers.length}\n`);

    const inactiveUsers = allUsers.filter((u) => !u.isActive);
    const activeUsers = allUsers.filter((u) => u.isActive);

    console.log(`✅ Usuários ativos: ${activeUsers.length}`);
    activeUsers.forEach((u) => {
      console.log(`   - ${u.name || "Sem nome"} (${u.email})`);
    });

    console.log(`\n❌ Usuários inativos: ${inactiveUsers.length}`);
    if (inactiveUsers.length > 0) {
      inactiveUsers.forEach((u) => {
        console.log(`   - ${u.name || "Sem nome"} (${u.email})`);
      });
      console.log("\n⚠️  PROBLEMA ENCONTRADO!");
      console.log("Usuários inativos NÃO podem criar cards, colunas, ou fazer qualquer ação no sistema.");
      console.log("Execute o seguinte comando para ativar todos os usuários:");
      console.log("\nnpx tsx scripts/activate-all-users.ts\n");
    } else {
      console.log("   Nenhum usuário inativo encontrado.\n");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
