import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Adicionando coluna 'Finalizado' em todos os boards...\n");

  const boards = await prisma.board.findMany({
    include: {
      columns: {
        orderBy: { order: "desc" },
        take: 1,
      },
    },
  });

  console.log(`📋 Encontrados ${boards.length} boards\n`);

  let added = 0;
  let skipped = 0;

  for (const board of boards) {
    try {
      // Verificar se já tem coluna "Finalizado"
      const existingFinished = await prisma.column.findFirst({
        where: {
          boardId: board.id,
          title: { contains: "Finalizado", mode: "insensitive" },
        },
      });

      if (existingFinished) {
        console.log(`⏭️  ${board.title} - já tem coluna Finalizado`);
        skipped++;
        continue;
      }

      // Pegar o maior order atual
      const lastColumn = board.columns[0];
      const nextOrder = lastColumn ? lastColumn.order + 1 : 0;

      // Criar coluna "Finalizado"
      await prisma.column.create({
        data: {
          boardId: board.id,
          title: "✅ Finalizado",
          order: nextOrder,
        },
      });

      console.log(`✅ ${board.title} - coluna Finalizado adicionada (ordem: ${nextOrder})`);
      added++;
    } catch (error) {
      console.error(`❌ Erro ao processar board ${board.title}:`, error);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 RESUMO:`);
  console.log(`   ✅ ${added} colunas adicionadas`);
  console.log(`   ⏭️  ${skipped} boards já tinham coluna Finalizado`);
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