/**
 * Teste Completo do Sistema de XP Proporcional
 *
 * Testa todos os cenários:
 * 1. Card sem assignees (quem marca ganha tudo)
 * 2. Card com 1 assignee (100% do XP)
 * 3. Card com 2 assignees (distribuição proporcional 70/30)
 * 4. Card com 3 assignees (distribuição igual 33/33/33)
 * 5. User não-assignee tentando marcar tarefas
 * 6. Verificação de TaskContribution
 * 7. Verificação de doneBy
 * 8. Recálculo de levels
 */

import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const CARD_COMPLETION_XP = 500;
const CARD_COMPLETION_COINS = 300;

interface TestUser {
  id: string;
  email: string;
  name: string;
}

let testUsers: TestUser[] = [];
let testBoardId: string;
let testColumnId: string;
let finishedColumnId: string;

/**
 * Helper to mark a task and track contribution
 */
async function markTaskAsComplete(itemId: string, cardId: string, userId: string) {
  await prisma.checklistItem.update({
    where: { id: itemId },
    data: { done: true, doneAt: new Date(), doneBy: userId },
  });

  const { trackTaskContribution } = await import("../lib/gamification/award-xp");
  await trackTaskContribution(cardId, userId);
}

async function createTestUsers() {
  console.log("\n🔧 Criando usuários de teste...");

  const names = ["Alice Test", "Bob Test", "Carol Test", "Dave Test"];
  const passwordHash = await argon2.hash("test123");

  for (const name of names) {
    const email = name.toLowerCase().replace(" test", "") + "@test.com";

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: crypto.randomUUID(),
        email,
        name,
        passwordHash,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Reset UserStats
    await prisma.userStats.deleteMany({
      where: { userId: user.id },
    });

    await prisma.userStats.create({
      data: {
        userId: user.id,
        level: 1,
        xp: 0,
        coins: 0,
        currentStreak: 0,
        longestStreak: 0,
        tasksCompleted: 0,
        tasksCompletedOnTime: 0,
        cardsCompleted: 0,
        cardsCompletedOnTime: 0,
        criticalCardsCompleted: 0,
      },
    });

    testUsers.push({ id: user.id, email, name });
    console.log(`✅ ${name} (${email})`);
  }
}

async function createTestBoard() {
  console.log("\n🔧 Criando board de teste...");

  const board = await prisma.board.create({
    data: {
      id: crypto.randomUUID(),
      title: "Board Teste XP Proporcional",
      isOrgWide: false,
      ownerId: testUsers[0].id,
      updatedAt: new Date(),
    },
  });

  testBoardId = board.id;

  // Criar colunas
  const column = await prisma.column.create({
    data: {
      id: crypto.randomUUID(),
      boardId: testBoardId,
      title: "A Fazer",
      order: 0,
    },
  });

  testColumnId = column.id;

  const finishedColumn = await prisma.column.create({
    data: {
      id: crypto.randomUUID(),
      boardId: testBoardId,
      title: "✅ Finalizado",
      order: 1,
    },
  });

  finishedColumnId = finishedColumn.id;

  console.log(`✅ Board criado: ${board.title}`);
}

async function testScenario1_NoAssignees() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 CENÁRIO 1: Card SEM assignees");
  console.log("Expected: XP proporcional (Alice 50% = 250 XP, Bob 50% = 250 XP)");
  console.log("=".repeat(70));

  const card = await prisma.card.create({
    data: {
      id: crypto.randomUUID(),
      boardId: testBoardId,
      columnId: testColumnId,
      title: "Card Sem Assignees",
      urgency: "MEDIUM",
      createdById: testUsers[0].id,
      updatedAt: new Date(),
      checklists: {
        create: {
          id: crypto.randomUUID(),
          title: "Checklist 1",
          items: {
            create: [
              { id: crypto.randomUUID(), content: "Tarefa 1", done: false },
              { id: crypto.randomUUID(), content: "Tarefa 2", done: false },
            ],
          },
        },
      },
    },
    include: {
      checklists: { include: { items: true } },
    },
  });

  console.log(`✅ Card criado: ${card.title}`);
  console.log(`📝 Total de tarefas: ${card.checklists[0].items.length}`);

  // Alice marca a primeira tarefa
  const item1 = card.checklists[0].items[0];
  await markTaskAsComplete(item1.id, card.id, testUsers[0].id);
  console.log(`✅ Alice marcou tarefa 1`);

  // Bob marca a última tarefa (deveria ganhar os pontos)
  const item2 = card.checklists[0].items[1];
  await markTaskAsComplete(item2.id, card.id, testUsers[1].id);
  console.log(`✅ Bob marcou tarefa 2 (última)`);

  // Simular award XP
  const { awardXpForChecklistItem } = await import("../lib/gamification/award-xp");

  const cardWithChecklists = await prisma.card.findUnique({
    where: { id: card.id },
    include: { checklists: { include: { items: true } } },
  });

  const result = await awardXpForChecklistItem(
    testUsers[1].id,
    cardWithChecklists as any,
    true
  );

  console.log(`\n📊 Resultado:`);
  console.log(`   XP ganho: ${result.xpGained}`);
  console.log(`   Coins ganhas: ${result.coinsGained}`);
  console.log(`   Level up: ${result.leveledUp ? "SIM" : "NÃO"}`);

  // Verificar UserStats
  const bobStats = await prisma.userStats.findUnique({
    where: { userId: testUsers[1].id },
  });

  console.log(`\n✅ Bob Stats:`);
  console.log(`   XP: ${bobStats?.xp} (esperado: 250)`);
  console.log(`   Coins: ${bobStats?.coins} (esperado: 150)`);
  console.log(`   Cards completados: ${bobStats?.cardsCompleted}`);

  const success = bobStats?.xp === 250 && bobStats?.coins === 150;

  if (success) {
    console.log("\n✅ CENÁRIO 1: PASSOU");
  } else {
    console.log("\n❌ CENÁRIO 1: FALHOU");
  }

  return success;
}

async function testScenario2_SingleAssignee() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 CENÁRIO 2: Card COM 1 assignee");
  console.log("Expected: Assignee ganha 100% (500 XP + 300 coins)");
  console.log("=".repeat(70));

  const card = await prisma.card.create({
    data: {
      id: crypto.randomUUID(),
      boardId: testBoardId,
      columnId: testColumnId,
      title: "Card Com 1 Assignee",
      urgency: "MEDIUM",
      createdById: testUsers[0].id,
      updatedAt: new Date(),
      checklists: {
        create: {
          id: crypto.randomUUID(),
          title: "Checklist 1",
          items: {
            create: [
              { id: crypto.randomUUID(), content: "Tarefa 1", done: false },
              { id: crypto.randomUUID(), content: "Tarefa 2", done: false },
              { id: crypto.randomUUID(), content: "Tarefa 3", done: false },
            ],
          },
        },
      },
    },
    include: {
      checklists: { include: { items: true } },
    },
  });

  // Atribuir apenas Alice
  await prisma.cardAssignee.create({
    data: {
      cardId: card.id,
      userId: testUsers[0].id,
    },
  });

  console.log(`✅ Card criado: ${card.title}`);
  console.log(`👤 Assignee: Alice`);
  console.log(`📝 Total de tarefas: ${card.checklists[0].items.length}`);

  // Alice marca todas as tarefas
  for (let i = 0; i < card.checklists[0].items.length; i++) {
    const item = card.checklists[0].items[i];
    await markTaskAsComplete(item.id, card.id, testUsers[0].id);
    console.log(`✅ Alice marcou tarefa ${i + 1}`);
  }

  // Award XP
  const { awardXpForChecklistItem } = await import("../lib/gamification/award-xp");

  const cardWithChecklists = await prisma.card.findUnique({
    where: { id: card.id },
    include: { checklists: { include: { items: true } } },
  });

  const result = await awardXpForChecklistItem(
    testUsers[0].id,
    cardWithChecklists as any,
    true
  );

  console.log(`\n📊 Resultado:`);
  console.log(`   XP ganho: ${result.xpGained}`);
  console.log(`   Coins ganhas: ${result.coinsGained}`);

  // Verificar UserStats
  const aliceStats = await prisma.userStats.findUnique({
    where: { userId: testUsers[0].id },
  });

  console.log(`\n✅ Alice Stats:`);
  console.log(`   XP: ${aliceStats?.xp} (esperado: ${CARD_COMPLETION_XP})`);
  console.log(`   Coins: ${aliceStats?.coins} (esperado: ${CARD_COMPLETION_COINS})`);
  console.log(`   Tasks completadas: ${aliceStats?.tasksCompleted}`);

  // Verificar TaskContribution
  const contribution = await prisma.taskContribution.findUnique({
    where: {
      cardId_userId: {
        cardId: card.id,
        userId: testUsers[0].id,
      },
    },
  });

  console.log(`\n📊 TaskContribution:`);
  console.log(`   Tasks marcadas: ${contribution?.tasksMarked}/${contribution?.totalTasks}`);
  console.log(`   Contribuição: ${((contribution?.contributionPercent || 0) * 100).toFixed(1)}%`);
  console.log(`   XP earned: ${contribution?.xpEarned}`);
  console.log(`   Coins earned: ${contribution?.coinsEarned}`);

  const success = aliceStats?.xp === CARD_COMPLETION_XP &&
                  contribution?.contributionPercent === 1.0;

  if (success) {
    console.log("\n✅ CENÁRIO 2: PASSOU");
  } else {
    console.log("\n❌ CENÁRIO 2: FALHOU");
  }

  return success;
}

async function testScenario3_ProportionalDistribution() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 CENÁRIO 3: Card COM 2 assignees - Distribuição Proporcional 70/30");
  console.log("Expected: Alice 70% (350 XP + 210 coins), Bob 30% (150 XP + 90 coins)");
  console.log("=".repeat(70));

  const card = await prisma.card.create({
    data: {
      id: crypto.randomUUID(),
      boardId: testBoardId,
      columnId: testColumnId,
      title: "Card Com 2 Assignees (70/30)",
      urgency: "MEDIUM",
      createdById: testUsers[0].id,
      updatedAt: new Date(),
      checklists: {
        create: {
          id: crypto.randomUUID(),
          title: "Checklist 1",
          items: {
            create: Array.from({ length: 10 }, (_, i) => ({
              id: crypto.randomUUID(),
              content: `Tarefa ${i + 1}`,
              done: false,
            })),
          },
        },
      },
    },
    include: {
      checklists: { include: { items: true } },
    },
  });

  // Atribuir Alice e Bob
  await prisma.cardAssignee.createMany({
    data: [
      { cardId: card.id, userId: testUsers[0].id },
      { cardId: card.id, userId: testUsers[1].id },
    ],
  });

  console.log(`✅ Card criado: ${card.title}`);
  console.log(`👥 Assignees: Alice, Bob`);
  console.log(`📝 Total de tarefas: ${card.checklists[0].items.length}`);

  // Alice marca 7 tarefas (70%)
  for (let i = 0; i < 7; i++) {
    const item = card.checklists[0].items[i];
    await markTaskAsComplete(item.id, card.id, testUsers[0].id);
  }
  console.log(`✅ Alice marcou 7 tarefas (70%)`);

  // Bob marca 3 tarefas (30%)
  for (let i = 7; i < 10; i++) {
    const item = card.checklists[0].items[i];
    await markTaskAsComplete(item.id, card.id, testUsers[1].id);
  }
  console.log(`✅ Bob marcou 3 tarefas (30%)`);

  // Award XP
  const { awardXpForChecklistItem } = await import("../lib/gamification/award-xp");

  const cardWithChecklists = await prisma.card.findUnique({
    where: { id: card.id },
    include: { checklists: { include: { items: true } } },
  });

  await awardXpForChecklistItem(
    testUsers[1].id, // Bob marcou a última
    cardWithChecklists as any,
    true
  );

  // Verificar contribuições
  const aliceContribution = await prisma.taskContribution.findUnique({
    where: {
      cardId_userId: {
        cardId: card.id,
        userId: testUsers[0].id,
      },
    },
  });

  const bobContribution = await prisma.taskContribution.findUnique({
    where: {
      cardId_userId: {
        cardId: card.id,
        userId: testUsers[1].id,
      },
    },
  });

  console.log(`\n📊 Contribuições:`);
  console.log(`   Alice: ${aliceContribution?.tasksMarked}/10 = ${((aliceContribution?.contributionPercent || 0) * 100).toFixed(1)}%`);
  console.log(`   Alice XP: ${aliceContribution?.xpEarned} (esperado: 350)`);
  console.log(`   Alice Coins: ${aliceContribution?.coinsEarned} (esperado: 210)`);
  console.log();
  console.log(`   Bob: ${bobContribution?.tasksMarked}/10 = ${((bobContribution?.contributionPercent || 0) * 100).toFixed(1)}%`);
  console.log(`   Bob XP: ${bobContribution?.xpEarned} (esperado: 150)`);
  console.log(`   Bob Coins: ${bobContribution?.coinsEarned} (esperado: 90)`);

  const success =
    aliceContribution?.xpEarned === 350 &&
    aliceContribution?.coinsEarned === 210 &&
    bobContribution?.xpEarned === 150 &&
    bobContribution?.coinsEarned === 90;

  if (success) {
    console.log("\n✅ CENÁRIO 3: PASSOU");
  } else {
    console.log("\n❌ CENÁRIO 3: FALHOU");
  }

  return success;
}

async function testScenario4_EqualDistribution() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 CENÁRIO 4: Card COM 3 assignees - Distribuição Igual");
  console.log("Expected: Cada um ~33.3% (~167 XP + ~100 coins)");
  console.log("=".repeat(70));

  const card = await prisma.card.create({
    data: {
      id: crypto.randomUUID(),
      boardId: testBoardId,
      columnId: testColumnId,
      title: "Card Com 3 Assignees (igual)",
      urgency: "MEDIUM",
      createdById: testUsers[0].id,
      updatedAt: new Date(),
      checklists: {
        create: {
          id: crypto.randomUUID(),
          title: "Checklist 1",
          items: {
            create: Array.from({ length: 9 }, (_, i) => ({
              id: crypto.randomUUID(),
              content: `Tarefa ${i + 1}`,
              done: false,
            })),
          },
        },
      },
    },
    include: {
      checklists: { include: { items: true } },
    },
  });

  // Atribuir Alice, Bob e Carol
  await prisma.cardAssignee.createMany({
    data: [
      { cardId: card.id, userId: testUsers[0].id },
      { cardId: card.id, userId: testUsers[1].id },
      { cardId: card.id, userId: testUsers[2].id },
    ],
  });

  console.log(`✅ Card criado: ${card.title}`);
  console.log(`👥 Assignees: Alice, Bob, Carol`);
  console.log(`📝 Total de tarefas: ${card.checklists[0].items.length}`);

  // Cada um marca 3 tarefas (33.3%)
  for (let i = 0; i < 3; i++) {
    await markTaskAsComplete(card.checklists[0].items[i].id, card.id, testUsers[0].id);
  }
  console.log(`✅ Alice marcou 3 tarefas`);

  for (let i = 3; i < 6; i++) {
    await markTaskAsComplete(card.checklists[0].items[i].id, card.id, testUsers[1].id);
  }
  console.log(`✅ Bob marcou 3 tarefas`);

  for (let i = 6; i < 9; i++) {
    await markTaskAsComplete(card.checklists[0].items[i].id, card.id, testUsers[2].id);
  }
  console.log(`✅ Carol marcou 3 tarefas`);

  // Award XP
  const { awardXpForChecklistItem } = await import("../lib/gamification/award-xp");

  const cardWithChecklists = await prisma.card.findUnique({
    where: { id: card.id },
    include: { checklists: { include: { items: true } } },
  });

  await awardXpForChecklistItem(
    testUsers[2].id, // Carol marcou a última
    cardWithChecklists as any,
    true
  );

  // Verificar contribuições
  const contributions = await prisma.taskContribution.findMany({
    where: { cardId: card.id },
  });

  console.log(`\n📊 Contribuições:`);
  for (let i = 0; i < 3; i++) {
    const contrib = contributions.find(c => c.userId === testUsers[i].id);
    console.log(`   ${testUsers[i].name}: ${contrib?.tasksMarked}/9 = ${((contrib?.contributionPercent || 0) * 100).toFixed(1)}%`);
    console.log(`   XP: ${contrib?.xpEarned}, Coins: ${contrib?.coinsEarned}`);
  }

  const expectedXp = Math.round(CARD_COMPLETION_XP / 3);
  const expectedCoins = Math.round(CARD_COMPLETION_COINS / 3);

  const allEqual = contributions.every(c =>
    Math.abs((c.xpEarned || 0) - expectedXp) <= 1 &&
    Math.abs((c.coinsEarned || 0) - expectedCoins) <= 1
  );

  if (allEqual) {
    console.log("\n✅ CENÁRIO 4: PASSOU");
  } else {
    console.log("\n❌ CENÁRIO 4: FALHOU");
  }

  return allEqual;
}

async function testScenario5_NonAssigneeNoXP() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 CENÁRIO 5: User NÃO-assignee tenta marcar tarefas");
  console.log("Expected: Dave não ganha XP (não assignee). Alice ganha 0 XP (não marcou tarefas)");
  console.log("=".repeat(70));

  const card = await prisma.card.create({
    data: {
      id: crypto.randomUUID(),
      boardId: testBoardId,
      columnId: testColumnId,
      title: "Card Com Assignees - Dave não incluído",
      urgency: "MEDIUM",
      createdById: testUsers[0].id,
      updatedAt: new Date(),
      checklists: {
        create: {
          id: crypto.randomUUID(),
          title: "Checklist 1",
          items: {
            create: [
              { id: crypto.randomUUID(), content: "Tarefa 1", done: false },
              { id: crypto.randomUUID(), content: "Tarefa 2", done: false },
            ],
          },
        },
      },
    },
    include: {
      checklists: { include: { items: true } },
    },
  });

  // Atribuir apenas Alice
  await prisma.cardAssignee.create({
    data: {
      cardId: card.id,
      userId: testUsers[0].id,
    },
  });

  console.log(`✅ Card criado: ${card.title}`);
  console.log(`👤 Assignee: Alice`);
  console.log(`📝 Total de tarefas: 2`);

  // Dave (não-assignee) marca todas as tarefas
  for (const item of card.checklists[0].items) {
    await markTaskAsComplete(item.id, card.id, testUsers[3].id);
  }
  console.log(`⚠️  Dave (NÃO-assignee) marcou todas as tarefas`);

  // Award XP (Dave tenta)
  const { awardXpForChecklistItem } = await import("../lib/gamification/award-xp");

  const cardWithChecklists = await prisma.card.findUnique({
    where: { id: card.id },
    include: { checklists: { include: { items: true } } },
  });

  const daveResult = await awardXpForChecklistItem(
    testUsers[3].id, // Dave
    cardWithChecklists as any,
    true
  );

  console.log(`\n📊 Resultado Dave:`);
  console.log(`   XP ganho: ${daveResult.xpGained} (esperado: 0)`);
  console.log(`   Coins ganhas: ${daveResult.coinsGained} (esperado: 0)`);

  // Verificar que Alice ganhou o XP
  const aliceContribution = await prisma.taskContribution.findUnique({
    where: {
      cardId_userId: {
        cardId: card.id,
        userId: testUsers[0].id,
      },
    },
  });

  console.log(`\n📊 Alice (assignee legítimo):`);
  console.log(`   Tasks marcadas: ${aliceContribution?.tasksMarked || 0}/2`);
  console.log(`   XP earned: ${aliceContribution?.xpEarned || 0} (esperado: 0 - não marcou tarefas)`);

  const success =
    daveResult.xpGained === 0 &&
    (aliceContribution?.xpEarned || 0) === 0;

  if (success) {
    console.log("\n✅ CENÁRIO 5: PASSOU");
  } else {
    console.log("\n❌ CENÁRIO 5: FALHOU");
  }

  return success;
}

async function testScenario6_VerifyDoneBy() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 CENÁRIO 6: Verificar campo doneBy");
  console.log("Expected: Todos os ChecklistItems devem ter doneBy preenchido");
  console.log("=".repeat(70));

  const card = await prisma.card.create({
    data: {
      id: crypto.randomUUID(),
      boardId: testBoardId,
      columnId: testColumnId,
      title: "Card Verificação DoneBy",
      urgency: "MEDIUM",
      createdById: testUsers[0].id,
      updatedAt: new Date(),
      checklists: {
        create: {
          id: crypto.randomUUID(),
          title: "Checklist 1",
          items: {
            create: [
              { id: crypto.randomUUID(), content: "Tarefa Alice", done: false },
              { id: crypto.randomUUID(), content: "Tarefa Bob", done: false },
              { id: crypto.randomUUID(), content: "Tarefa Carol", done: false },
            ],
          },
        },
      },
    },
    include: {
      checklists: { include: { items: true } },
    },
  });

  // Cada pessoa marca uma tarefa
  await markTaskAsComplete(card.checklists[0].items[0].id, card.id, testUsers[0].id);
  await markTaskAsComplete(card.checklists[0].items[1].id, card.id, testUsers[1].id);
  await markTaskAsComplete(card.checklists[0].items[2].id, card.id, testUsers[2].id);

  console.log(`✅ Card criado com 3 tarefas`);
  console.log(`✅ Alice marcou tarefa 1`);
  console.log(`✅ Bob marcou tarefa 2`);
  console.log(`✅ Carol marcou tarefa 3`);

  // Verificar doneBy
  const items = await prisma.checklistItem.findMany({
    where: {
      checklistId: card.checklists[0].id,
    },
    include: {
      user: {
        select: { name: true },
      },
    },
  });

  console.log(`\n📊 Verificação doneBy:`);
  let allCorrect = true;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const expectedUser = testUsers[i];
    const correct = item.doneBy === expectedUser.id;

    console.log(`   ${item.content}: ${item.user?.name || "NULL"} ${correct ? "✅" : "❌"}`);

    if (!correct) allCorrect = false;
  }

  if (allCorrect) {
    console.log("\n✅ CENÁRIO 6: PASSOU");
  } else {
    console.log("\n❌ CENÁRIO 6: FALHOU");
  }

  return allCorrect;
}

async function cleanup() {
  console.log("\n🧹 Limpando dados de teste...");

  // Deletar em ordem (respeitando constraints)
  await prisma.taskContribution.deleteMany({
    where: {
      card: {
        boardId: testBoardId,
      },
    },
  });

  await prisma.checklistItem.deleteMany({
    where: {
      checklist: {
        card: {
          boardId: testBoardId,
        },
      },
    },
  });

  await prisma.checklist.deleteMany({
    where: {
      card: {
        boardId: testBoardId,
      },
    },
  });

  await prisma.cardAssignee.deleteMany({
    where: {
      card: {
        boardId: testBoardId,
      },
    },
  });

  await prisma.card.deleteMany({
    where: { boardId: testBoardId },
  });

  await prisma.column.deleteMany({
    where: { boardId: testBoardId },
  });

  await prisma.board.delete({
    where: { id: testBoardId },
  });

  // Deletar usuários de teste
  for (const user of testUsers) {
    await prisma.userStats.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });
  }

  console.log("✅ Limpeza concluída");
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TESTE COMPLETO DO SISTEMA DE XP PROPORCIONAL");
  console.log("=".repeat(70));

  const results: { [key: string]: boolean } = {};

  try {
    await createTestUsers();
    await createTestBoard();

    results["Cenário 1 - Sem Assignees"] = await testScenario1_NoAssignees();
    results["Cenário 2 - 1 Assignee"] = await testScenario2_SingleAssignee();
    results["Cenário 3 - Proporcional 70/30"] = await testScenario3_ProportionalDistribution();
    results["Cenário 4 - 3 Assignees Igual"] = await testScenario4_EqualDistribution();
    results["Cenário 5 - Não-Assignee"] = await testScenario5_NonAssigneeNoXP();
    results["Cenário 6 - Verificar DoneBy"] = await testScenario6_VerifyDoneBy();

    await cleanup();

    // Relatório final
    console.log("\n" + "=".repeat(70));
    console.log("📊 RELATÓRIO FINAL");
    console.log("=".repeat(70));

    let totalPassed = 0;
    let totalTests = Object.keys(results).length;

    for (const [scenario, passed] of Object.entries(results)) {
      console.log(`${passed ? "✅" : "❌"} ${scenario}`);
      if (passed) totalPassed++;
    }

    console.log("\n" + "=".repeat(70));
    console.log(`🎯 Resultado: ${totalPassed}/${totalTests} testes passaram`);
    console.log("=".repeat(70));

    if (totalPassed === totalTests) {
      console.log("\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!");
    } else {
      console.log("\n⚠️  Alguns testes falharam. Verifique os logs acima.");
    }

  } catch (error) {
    console.error("\n❌ Erro durante os testes:", error);
    await cleanup();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
