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
 */
export async function awardXpForChecklistItem(
  userId: string,
  card: CardWithChecklists,
  isCardComplete: boolean
): Promise<GamificationResult> {
  // Ensure user has stats
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

  // Calculate base XP - 1 XP per checklist item
  let xpGained = calculateChecklistItemXp();
  let coinsGained = 0;
  let achievementXp = 0;
  let achievementCoins = 0;
  const newAchievements: string[] = [];

  // Update streak
  const streakUpdate = updateStreakStats({
    currentStreak: userStats.currentStreak,
    longestStreak: userStats.longestStreak,
    lastActiveDate: userStats.lastActiveDate,
  });

  // Check for streak milestone
  const streakMilestone = streakUpdate.streakChanged
    ? getStreakMilestone(streakUpdate.currentStreak)
    : null;

  if (streakMilestone && streakMilestone.milestone === streakUpdate.currentStreak) {
    xpGained += streakMilestone.reward.xp;
    coinsGained += streakMilestone.reward.coins;
  }

  // If card is complete, add completion bonus (10% + bônus pontualidade + bônus crítico)
  if (isCardComplete) {
    // Conta todas as tarefas do card
    const totalTasks = card.checklists.reduce((sum, checklist) => sum + checklist.items.length, 0);

    const cardXp = calculateCardCompletionXp(totalTasks, {
      urgency: card.urgency as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      dueAt: card.dueAt,
      completedAt: new Date(), // Card está sendo completo agora
    });
    xpGained += cardXp;
  }

  // Calculate coins from XP
  coinsGained += calculateCoinsFromXp(xpGained);

  // Prepare updated stats
  const tasksCompleted = userStats.tasksCompleted + 1;
  const tasksCompletedOnTime = card.dueAt && (!card.completedAt || card.completedAt <= card.dueAt)
    ? userStats.tasksCompletedOnTime + 1
    : userStats.tasksCompletedOnTime;

  const cardsCompleted = isCardComplete
    ? userStats.cardsCompleted + 1
    : userStats.cardsCompleted;

  const cardsCompletedOnTime = isCardComplete && card.dueAt && card.completedAt && card.completedAt <= card.dueAt
    ? userStats.cardsCompletedOnTime + 1
    : userStats.cardsCompletedOnTime;

  const criticalCardsCompleted = isCardComplete && card.urgency === 'CRITICAL'
    ? userStats.criticalCardsCompleted + 1
    : userStats.criticalCardsCompleted;

  // Check for new achievements
  const currentAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementKey: true },
  });

  const achievementKeys = currentAchievements.map(a => a.achievementKey);

  const stats = {
    tasksCompleted,
    tasksCompletedOnTime,
    cardsCompleted,
    cardsCompletedOnTime,
    criticalCardsCompleted,
    currentStreak: streakUpdate.currentStreak,
    longestStreak: streakUpdate.longestStreak,
    level: userStats.level,
  };

  const unlockedAchievements = checkUnlockedAchievements(stats, achievementKeys);

  // Award achievement XP and coins
  for (const achievement of unlockedAchievements) {
    newAchievements.push(achievement.key);
    achievementXp += achievement.xpReward;
    achievementCoins += achievement.coinsReward || 0;
  }

  // Total XP and coins
  const totalXpGained = xpGained + achievementXp;
  const totalCoinsGained = coinsGained + achievementCoins;

  // Calculate new level
  const newTotalXp = userStats.xp + totalXpGained;
  const newLevel = getLevelFromXp(newTotalXp);
  const leveledUp = newLevel > userStats.level;

  // Update user stats
  const updatedStats = await prisma.userStats.update({
    where: { userId },
    data: {
      xp: newTotalXp,
      coins: userStats.coins + totalCoinsGained,
      level: newLevel,
      currentStreak: streakUpdate.currentStreak,
      longestStreak: streakUpdate.longestStreak,
      lastActiveDate: streakUpdate.lastActiveDate,
      tasksCompleted,
      tasksCompletedOnTime,
      cardsCompleted,
      cardsCompletedOnTime,
      criticalCardsCompleted,
    },
  });

  // Create achievement records
  if (newAchievements.length > 0) {
    await prisma.userAchievement.createMany({
      data: newAchievements.map(key => ({
        userId,
        achievementKey: key,
      })),
      skipDuplicates: true,
    });
  }

  return {
    xpGained: totalXpGained,
    totalXp: newTotalXp,
    coinsGained: totalCoinsGained,
    totalCoins: updatedStats.coins,
    leveledUp,
    newLevel,
    previousLevel: userStats.level,
    newAchievements,
    achievementXp,
    achievementCoins,
    streakMilestone: streakMilestone && streakMilestone.milestone === streakUpdate.currentStreak
      ? {
          days: streakMilestone.milestone,
          reward: streakMilestone.reward,
        }
      : undefined,
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