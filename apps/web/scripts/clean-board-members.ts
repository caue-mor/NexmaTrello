import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Limpando membros dos boards (mantendo apenas os donos)...");

  // Buscar todos os boards com seus donos
  const boards = await prisma.board.findMany({
    select: { id: true, title: true, ownerId: true },
  });

  for (const board of boards) {
    console.log(`\n📋 Board: ${board.title}`);

    // Deletar todos os membros EXCETO o dono
    const deleted = await prisma.boardMember.deleteMany({
      where: {
        boardId: board.id,
        userId: { not: board.ownerId },
      },
    });

    console.log(`   ✅ ${deleted.count} membros removidos`);
  }

  console.log("\n✨ Limpeza concluída!");
  console.log("💡 Agora os boards têm apenas seus criadores como membros.");
  console.log("💡 Use o botão 'Convidar' para adicionar outros usuários!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });