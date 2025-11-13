/**
 * GET /api/achievements/me - Get current user's achievements
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUserStats } from "@/lib/gamification/award-xp";
import { ACHIEVEMENTS, getAchievementProgress, getAchievementsByCategory, type AchievementStats } from "@/lib/gamification/achievements";

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

    // Ensure user has stats
    const userStats = await ensureUserStats(user.id);

    // Get user's unlocked achievements
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: 'desc' },
    });

    const unlockedKeys = unlockedAchievements.map(a => a.achievementKey);

    // Prepare achievement stats
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

    // Get achievements organized by category
    const achievementsByCategory = getAchievementsByCategory();

    // Build response with all achievements and their status
    const response = {
      summary: {
        total: ACHIEVEMENTS.length,
        unlocked: unlockedKeys.length,
        progress: (unlockedKeys.length / ACHIEVEMENTS.length) * 100,
        totalXpEarned: unlockedAchievements.reduce((total, ua) => {
          const achievement = ACHIEVEMENTS.find(a => a.key === ua.achievementKey);
          return total + (achievement?.xpReward || 0);
        }, 0),
        totalCoinsEarned: unlockedAchievements.reduce((total, ua) => {
          const achievement = ACHIEVEMENTS.find(a => a.key === ua.achievementKey);
          return total + (achievement?.coinsReward || 0);
        }, 0),
      },
      byCategory: {
        task: achievementsByCategory.task.map(achievement => ({
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          xpReward: achievement.xpReward,
          coinsReward: achievement.coinsReward || 0,
          tier: achievement.tier,
          unlocked: unlockedKeys.includes(achievement.key),
          progress: getAchievementProgress(achievement, achievementStats),
          unlockedAt: unlockedAchievements.find(a => a.achievementKey === achievement.key)?.unlockedAt || null,
        })),
        streak: achievementsByCategory.streak.map(achievement => ({
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          xpReward: achievement.xpReward,
          coinsReward: achievement.coinsReward || 0,
          tier: achievement.tier,
          unlocked: unlockedKeys.includes(achievement.key),
          progress: getAchievementProgress(achievement, achievementStats),
          unlockedAt: unlockedAchievements.find(a => a.achievementKey === achievement.key)?.unlockedAt || null,
        })),
        card: achievementsByCategory.card.map(achievement => ({
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          xpReward: achievement.xpReward,
          coinsReward: achievement.coinsReward || 0,
          tier: achievement.tier,
          unlocked: unlockedKeys.includes(achievement.key),
          progress: getAchievementProgress(achievement, achievementStats),
          unlockedAt: unlockedAchievements.find(a => a.achievementKey === achievement.key)?.unlockedAt || null,
        })),
        performance: achievementsByCategory.performance.map(achievement => ({
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          xpReward: achievement.xpReward,
          coinsReward: achievement.coinsReward || 0,
          tier: achievement.tier,
          unlocked: unlockedKeys.includes(achievement.key),
          progress: getAchievementProgress(achievement, achievementStats),
          unlockedAt: unlockedAchievements.find(a => a.achievementKey === achievement.key)?.unlockedAt || null,
        })),
      },
      recentlyUnlocked: unlockedAchievements.slice(0, 5).map(ua => {
        const achievement = ACHIEVEMENTS.find(a => a.key === ua.achievementKey);
        return {
          key: ua.achievementKey,
          unlockedAt: ua.unlockedAt,
          title: achievement?.title || 'Unknown',
          icon: achievement?.icon || '🏆',
          xpReward: achievement?.xpReward || 0,
          coinsReward: achievement?.coinsReward || 0,
          tier: achievement?.tier || 'bronze',
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Erro ao buscar conquistas" },
      { status: 500 }
    );
  }
}