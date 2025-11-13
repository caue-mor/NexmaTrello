/**
 * GET /api/stats/me - Get current user's gamification stats
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUserStats } from "@/lib/gamification/award-xp";
import { getLevelProgress, getLevelTitle, getLevelColor } from "@/lib/gamification/xp-system";
import { getStreakStatus, getDaysUntilStreakLost } from "@/lib/gamification/streak-system";
import { ACHIEVEMENTS, getAchievementProgress, type AchievementStats } from "@/lib/gamification/achievements";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Ensure user has stats (creates if doesn't exist)
    const userStats = await ensureUserStats(user.id);

    // Get user's unlocked achievements
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: 'desc' },
    });

    const unlockedKeys = unlockedAchievements.map(a => a.achievementKey);

    // Calculate level progress
    const levelProgress = getLevelProgress(userStats.xp);

    // Get streak status
    const streakStatus = getStreakStatus(userStats.currentStreak);
    const daysUntilStreakLost = getDaysUntilStreakLost(userStats.lastActiveDate);

    // Prepare achievement stats for progress calculation
    const achievementStats: AchievementStats = {
      tasksCompleted: userStats.tasksCompleted,
      tasksCompletedOnTime: userStats.tasksCompletedOnTime,
      cardsCompleted: userStats.cardsCompleted,
      cardsCompletedOnTime: userStats.cardsCompletedOnTime,
      criticalCardsCompleted: userStats.criticalCardsCompleted,
      currentStreak: userStats.currentStreak,
      longestStreak: userStats.longestStreak,
      level: userStats.level,
    };

    // Get all achievements with progress
    const allAchievements = ACHIEVEMENTS.map(achievement => ({
      key: achievement.key,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
      coinsReward: achievement.coinsReward || 0,
      category: achievement.category,
      tier: achievement.tier,
      unlocked: unlockedKeys.includes(achievement.key),
      progress: getAchievementProgress(achievement, achievementStats),
      unlockedAt: unlockedAchievements.find(a => a.achievementKey === achievement.key)?.unlockedAt || null,
    }));

    // Calculate completion stats
    const totalAchievements = ACHIEVEMENTS.length;
    const achievementsUnlocked = unlockedKeys.length;
    const achievementsProgress = (achievementsUnlocked / totalAchievements) * 100;

    // Calculate performance metrics
    const taskCompletionRate = userStats.tasksCompleted > 0
      ? (userStats.tasksCompletedOnTime / userStats.tasksCompleted) * 100
      : 0;

    const cardCompletionRate = userStats.cardsCompleted > 0
      ? (userStats.cardsCompletedOnTime / userStats.cardsCompleted) * 100
      : 0;

    // Build response
    const response = {
      stats: {
        userId: userStats.userId,
        level: userStats.level,
        levelTitle: getLevelTitle(userStats.level),
        levelColor: getLevelColor(userStats.level),
        xp: userStats.xp,
        coins: userStats.coins,
        currentStreak: userStats.currentStreak,
        longestStreak: userStats.longestStreak,
        lastActiveDate: userStats.lastActiveDate,
        tasksCompleted: userStats.tasksCompleted,
        tasksCompletedOnTime: userStats.tasksCompletedOnTime,
        cardsCompleted: userStats.cardsCompleted,
        cardsCompletedOnTime: userStats.cardsCompletedOnTime,
        criticalCardsCompleted: userStats.criticalCardsCompleted,
      },
      levelProgress: {
        ...levelProgress,
        xpForCurrentLevel: levelProgress.currentLevelXp,
        xpNeededForNextLevel: levelProgress.xpForNextLevel,
        progressPercentage: levelProgress.progress,
      },
      streak: {
        current: userStats.currentStreak,
        longest: userStats.longestStreak,
        status: streakStatus,
        daysUntilLost: daysUntilStreakLost,
      },
      achievements: {
        total: totalAchievements,
        unlocked: achievementsUnlocked,
        progress: achievementsProgress,
        list: allAchievements,
      },
      performance: {
        taskCompletionRate: Math.round(taskCompletionRate),
        cardCompletionRate: Math.round(cardCompletionRate),
        totalTasksCompleted: userStats.tasksCompleted,
        totalCardsCompleted: userStats.cardsCompleted,
        criticalCardsCompleted: userStats.criticalCardsCompleted,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas do usuário" },
      { status: 500 }
    );
  }
}