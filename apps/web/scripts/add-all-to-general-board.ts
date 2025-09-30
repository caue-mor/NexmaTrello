import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Adicionando todos os usuários ao board 'Trello Geral Nexma'...\n");

  // Buscar o board "Trello Geral Nexma"
  const generalBoard = await prisma.board.findFirst({
    where: {
      title: "Trello Geral Nexma",
    },
  });

  if (!generalBoard) {
    console.log("❌ Board 'Trello Geral Nexma' não encontrado!");
    return;
  }

  console.log(`✅ Board encontrado: ${generalBoard.title} (${generalBoard.id})\n`);

  // Buscar todos os usuários ativos
  const allUsers = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log(`👥 Encontrados ${allUsers.length} usuários ativos\n`);

  let added = 0;
  let existing = 0;

  for (const user of allUsers) {
    try {
      // Verificar se já é membro
      const existingMember = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: generalBoard.id,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        console.log(`⏭️  ${user.name || user.email} - já é membro`);
        existing++;
      } else {
        // Adicionar como membro
        await prisma.boardMember.create({
          data: {
            boardId: generalBoard.id,
            userId: user.id,
            role: "MEMBER",
          },
        });
        console.log(`✅ ${user.name || user.email} - adicionado como MEMBER`);
        added++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ${user.email}:`, error);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 RESUMO:`);
  console.log(`   ✅ ${added} usuários adicionados`);
  console.log(`   ⏭️  ${existing} já eram membros`);
  console.log(`   📈 Total de membros: ${added + existing}`);
  console.log("\n✨ Processo concluído!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro fatal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });