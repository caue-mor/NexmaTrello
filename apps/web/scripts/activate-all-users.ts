import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔄 Ativando todos os usuários...\n");

    const result = await prisma.user.updateMany({
      where: { isActive: false },
      data: { isActive: true },
    });

    console.log(`✅ ${result.count} usuário(s) ativado(s)!`);

    if (result.count === 0) {
      console.log("✅ Todos os usuários já estavam ativos.");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
