/**
 * Award XP - Main function to award XP and handle gamification
 */

import { prisma } from '@/lib/db';
import {
  calculateChecklistItemXp,
  calculateCardCompletionXp,
  calculateCoinsFromXp,
  getLevelFromXp
} from './xp-system';
import { checkUnlockedAchievements, getAchievement } from './achievements';
import { updateStreakStats, getStreakMilestone } from './streak-system';
import type { Card, Checklist, ChecklistItem, UserStats, Urgency } from '@prisma/client';

export interface GamificationResult {
  xpGained: number;
  totalXp: number;
  coinsGained: number;
  totalCoins: number;
  leveledUp: boolean;
  newLevel: number;
  previousLevel: number;
  newAchievements: string[];
  achievementXp: number;
  achievementCoins: number;
  streakMilestone?: {
    days: number;
    reward: { coins: number; xp: number };
  };
}

interface CardWithChecklists extends Card {
  checklists: (Checklist & {
    items: ChecklistItem[];
  })[];
}

/**
 * Award XP for completing a checklist item
 * REGRA: XP proporcional - quem faz mais ganha mais!
 * Card completo = 500 XP + 300 COINS dividido proporcionalmente
 */
export async function awardXpForChecklistItem(
  userId: string,
  card: CardWithChecklists,
  isCardComplete: boolean
): Promise<GamificationResult> {
  // 1. Verificar assignees do card
  const assignees = await prisma.cardAssignee.findMany({
    where: { cardId: card.id },
    select: { userId: true },
  });

  // 2. Se card tem assignees, XP só para eles. Se não tem, XP para quem marcou.
  const eligibleUserIds = assignees.length > 0
    ? assignees.map(a => a.userId)
    : [userId];

  // 3. Se quem marcou NÃO está na lista de elegíveis, retornar sem dar XP
  if (!eligibleUserIds.includes(userId)) {
    console.log(`⚠️  User ${userId} marcou tarefa mas NÃO está atribuído ao card ${card.id}`);
    return {
      xpGained: 0,
      totalXp: 0,
      coinsGained: 0,
      totalCoins: 0,
      leveledUp: false,
      newLevel: 1,
      previousLevel: 1,
      newAchievements: [],
      achievementXp: 0,
      achievementCoins: 0,
    };
  }

  console.log(`✅ User ${userId} elegível para XP no card ${card.id}`);

  // 4. Se card NÃO completou ainda, retornar sem dar XP (XP só no final)
  if (!isCardComplete) {
    return {
      xpGained: 0,
      totalXp: 0,
      coinsGained: 0,
      totalCoins: 0,
      leveledUp: false,
      newLevel: 1,
      previousLevel: 1,
      newAchievements: [],
      achievementXp: 0,
      achievementCoins: 0,
    };
  }

  // 5. Card COMPLETOU! Distribuir XP proporcionalmente para TODOS os assignees
  console.log(`🎉 Card ${card.id} completado! Distribuindo XP para assignees...`);
  await distributeXpToAssignees(card, eligibleUserIds);

  // 6. Retornar resultado para o usuário atual
  const userContribution = await prisma.taskContribution.findUnique({
    where: {
      cardId_userId: {
        cardId: card.id,
        userId,
      },
    },
  });

  if (!userContribution) {
    console.error(`TaskContribution not found for user ${userId} card ${card.id}`);
    return {
      xpGained: 0,
      totalXp: 0,
      coinsGained: 0,
      totalCoins: 0,
      leveledUp: false,
      newLevel: 1,
      previousLevel: 1,
      newAchievements: [],
      achievementXp: 0,
      achievementCoins: 0,
    };
  }

  console.log(`✅ User ${userId} ganhou ${userContribution.xpEarned} XP, ${userContribution.coinsEarned} coins`);

  // Stats já foram atualizados por distributeXpToAssignees
  const userStats = await prisma.userStats.findUnique({
    where: { userId },
  });

  if (!userStats) {
    console.error(`UserStats not found for user ${userId}`);
    return {
      xpGained: userContribution.xpEarned,
      totalXp: userContribution.xpEarned,
      coinsGained: userContribution.coinsEarned,
      totalCoins: userContribution.coinsEarned,
      leveledUp: false,
      newLevel: 1,
      previousLevel: 1,
      newAchievements: [],
      achievementXp: 0,
      achievementCoins: 0,
    };
  }

  const xpGained = userContribution.xpEarned;
  const coinsGained = userContribution.coinsEarned;
  let achievementXp = 0;
  let achievementCoins = 0;
  const newAchievements: string[] = [];

  // Stats já foram atualizados - apenas retornar valores
  const previousLevel = getLevelFromXp(userStats.xp - xpGained);
  const currentLevel = userStats.level;
  const leveledUp = currentLevel > previousLevel;

  return {
    xpGained,
    totalXp: userStats.xp,
    coinsGained,
    totalCoins: userStats.coins,
    leveledUp,
    newLevel: currentLevel,
    previousLevel,
    newAchievements,
    achievementXp,
    achievementCoins,
  };
}

/**
 * Initialize user stats if they don't exist
 */
export async function ensureUserStats(userId: string): Promise<UserStats> {
  let userStats = await prisma.userStats.findUnique({
    where: { userId },
  });

  if (!userStats) {
    userStats = await prisma.userStats.create({
      data: {
        userId,
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
  }

  return userStats;
}

/**
 * Get user stats with achievements
 */
export async function getUserStatsWithAchievements(userId: string) {
  const stats = await ensureUserStats(userId);

  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
  });

  return {
    stats,
    achievements: achievements.map(a => ({
      ...a,
      details: getAchievement(a.achievementKey),
    })),
  };
}

/**
 * Track user contribution to a card (increment task count)
 * EXPORT para ser usada em testes e endpoint
 */
export async function trackTaskContribution(cardId: string, userId: string): Promise<void> {
  // Contar total de tarefas do card
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      checklists: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!card) return;

  const totalTasks = card.checklists.reduce((sum, checklist) => sum + checklist.items.length, 0);

  // Upsert contribution (criar ou incrementar)
  await prisma.taskContribution.upsert({
    where: {
      cardId_userId: {
        cardId,
        userId,
      },
    },
    update: {
      tasksMarked: {
        increment: 1,
      },
      totalTasks,
    },
    create: {
      cardId,
      userId,
      tasksMarked: 1,
      totalTasks,
      contributionPercent: 0, // Será calculado depois
      xpEarned: 0,
      coinsEarned: 0,
    },
  });
}

/**
 * Distribute XP proportionally to all assignees when card is completed
 * FIXED VALUES: 500 XP + 300 COINS per completed card
 */
async function distributeXpToAssignees(
  card: CardWithChecklists,
  assigneeUserIds: string[]
): Promise<void> {
  const CARD_COMPLETION_XP = 500;
  const CARD_COMPLETION_COINS = 300;

  // Buscar contribuições de todos os assignees
  const contributions = await prisma.taskContribution.findMany({
    where: {
      cardId: card.id,
      userId: { in: assigneeUserIds },
    },
  });

  // Calcular % de contribuição e XP/coins para cada um
  const totalTasks = card.checklists.reduce((sum, checklist) => sum + checklist.items.length, 0);

  for (const userId of assigneeUserIds) {
    // Buscar contribution OU contar tarefas marcadas diretamente do banco
    let contribution = contributions.find(c => c.userId === userId);

    // Se não tem contribution, verificar quantas tarefas este user marcou (doneBy)
    if (!contribution) {
      const tasksMarkedByUser = await prisma.checklistItem.count({
        where: {
          checklist: {
            cardId: card.id,
          },
          doneBy: userId,
          done: true,
        },
      });

      // Criar contribution com os valores corretos
      contribution = await prisma.taskContribution.create({
        data: {
          cardId: card.id,
          userId,
          tasksMarked: tasksMarkedByUser,
          totalTasks,
          contributionPercent: 0, // Será calculado abaixo
          xpEarned: 0,
          coinsEarned: 0,
        },
      });
    }

    const tasksMarked = contribution.tasksMarked;

    // % de contribuição = tarefas marcadas / total de tarefas
    const contributionPercent = totalTasks > 0 ? (tasksMarked / totalTasks) : (1 / assigneeUserIds.length);

    // XP proporcional
    const xpEarned = Math.round(CARD_COMPLETION_XP * contributionPercent);
    const coinsEarned = Math.round(CARD_COMPLETION_COINS * contributionPercent);

    console.log(`💰 User ${userId}: ${tasksMarked}/${totalTasks} tarefas (${(contributionPercent * 100).toFixed(1)}%) = ${xpEarned} XP, ${coinsEarned} coins`);

    // Atualizar contribution
    await prisma.taskContribution.upsert({
      where: {
        cardId_userId: {
          cardId: card.id,
          userId,
        },
      },
      update: {
        contributionPercent,
        xpEarned,
        coinsEarned,
        totalTasks,
      },
      create: {
        cardId: card.id,
        userId,
        tasksMarked: 0,
        totalTasks,
        contributionPercent,
        xpEarned,
        coinsEarned,
      },
    });

    // Atualizar UserStats
    await ensureUserStats(userId);

    await prisma.userStats.update({
      where: { userId },
      data: {
        xp: { increment: xpEarned },
        coins: { increment: coinsEarned },
        cardsCompleted: { increment: 1 },
        tasksCompleted: { increment: tasksMarked },
      },
    });

    // Recalcular level
    const updatedStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (updatedStats) {
      const newLevel = getLevelFromXp(updatedStats.xp);
      if (newLevel !== updatedStats.level) {
        await prisma.userStats.update({
          where: { userId },
          data: { level: newLevel },
        });
      }
    }
  }
}