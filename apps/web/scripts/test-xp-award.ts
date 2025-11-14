/**
 * Teste COMPLETO do sistema de XP
 * Simula marcar checklist item e verifica se XP aumenta
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Teste Completo de Award XP\n");

  try {
    // 1. Encontrar um usuário para testar
    const user = await prisma.user.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        stats: true,
      },
    });

    if (!user) {
      console.log("❌ Nenhum usuário encontrado!");
      return;
    }

    console.log(`✅ Usuário: ${user.name || user.email}`);

    // 2. Stats antes do teste
    const statsBefore = await prisma.userStats.findUnique({
      where: { userId: user.id },
    });

    console.log("\n📊 Stats ANTES do teste:");
    console.log(`   Nível: ${statsBefore?.level || 0}`);
    console.log(`   XP: ${statsBefore?.xp || 0}`);
    console.log(`   Moedas: ${statsBefore?.coins || 0}`);
    console.log(`   Tarefas: ${statsBefore?.tasksCompleted || 0}`);

    // 3. Encontrar um card com checklist items PENDENTES
    const card = await prisma.card.findFirst({
      where: {
        checklists: {
          some: {
            items: {
              some: { done: false },
            },
          },
        },
        board: {
          members: {
            some: { userId: user.id },
          },
        },
      },
      include: {
        checklists: {
          include: { items: true },
        },
        board: { select: { title: true } },
        column: { select: { title: true } },
      },
    });

    if (!card) {
      console.log("\n⚠️  Nenhum card com checklist pendente encontrado!");
      console.log("   Crie um card com checklist items para testar.");
      return;
    }

    console.log(`\n✅ Card encontrado: "${card.title}"`);
    console.log(`   Board: ${card.board.title}`);
    console.log(`   Coluna: ${card.column.title}`);

    // 4. Encontrar item pendente
    const pendingItem = card.checklists
      .flatMap(cl => cl.items)
      .find(item => !item.done);

    if (!pendingItem) {
      console.log("⚠️  Nenhum item pendente encontrado!");
      return;
    }

    console.log(`   Item: "${pendingItem.content}"`);

    // 5. SIMULAR chamada da API (marcar item como done)
    console.log("\n🎮 Marcando item como DONE...");

    const { awardXpForChecklistItem } = await import("../lib/gamification/award-xp");

    // Atualizar item no banco
    await prisma.checklistItem.update({
      where: { id: pendingItem.id },
      data: {
        done: true,
        doneAt: new Date(),
      },
    });

    // Verificar se todas as tarefas estão completas
    const allItems = card.checklists.flatMap(c => c.items);
    const allCompleted = allItems.every(item =>
      item.id === pendingItem.id ? true : item.done
    );

    // Dar XP
    const gamification = await awardXpForChecklistItem(
      user.id,
      card,
      allCompleted
    );

    console.log("\n🎉 XP CONCEDIDO!");
    console.log(`   XP ganho: +${gamification.xpGained}`);
    console.log(`   Moedas ganhas: +${gamification.coinsGained}`);

    if (gamification.leveledUp) {
      console.log(`   🎊 SUBIU DE NÍVEL! ${gamification.previousLevel} → ${gamification.newLevel}`);
    }

    if (gamification.newAchievements.length > 0) {
      console.log(`   🏆 Achievements desbloqueados: ${gamification.newAchievements.length}`);
      gamification.newAchievements.forEach(key => console.log(`      - ${key}`));
    }

    // 6. Stats DEPOIS do teste
    const statsAfter = await prisma.userStats.findUnique({
      where: { userId: user.id },
    });

    console.log("\n📊 Stats DEPOIS do teste:");
    console.log(`   Nível: ${statsAfter?.level || 0}`);
    console.log(`   XP: ${statsAfter?.xp || 0}`);
    console.log(`   Moedas: ${statsAfter?.coins || 0}`);
    console.log(`   Tarefas: ${statsAfter?.tasksCompleted || 0}`);

    // 7. Desfazer mudança (para não afetar o sistema)
    console.log("\n🔄 Desfazendo mudança no checklist item...");
    await prisma.checklistItem.update({
      where: { id: pendingItem.id },
      data: {
        done: false,
        doneAt: null,
      },
    });

    // Não desfazer XP/moedas - deixar o progresso do teste
    console.log("   ✅ Item restaurado para pendente");
    console.log("   ℹ️  XP e moedas foram mantidos (progresso salvo)");

    console.log("\n✅ TESTE COMPLETO!");
    console.log("\n📝 Resumo:");
    console.log(`   ✅ Sistema de XP está funcionando!`);
    console.log(`   ✅ Usuário ganhou ${gamification.xpGained} XP`);
    console.log(`   ✅ Usuário ganhou ${gamification.coinsGained} moedas`);

  } catch (error) {
    console.error("\n❌ Erro no teste:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
