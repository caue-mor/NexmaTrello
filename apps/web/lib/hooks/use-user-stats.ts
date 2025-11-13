/**
 * useUserStats - Hook to fetch and manage user gamification stats
 */

"use client";

import { useEffect, useState } from "react";

interface LevelProgress {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progress: number;
  xpForCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
}

interface StreakStatus {
  emoji: string;
  title: string;
  color: string;
}

interface Streak {
  current: number;
  longest: number;
  status: StreakStatus;
  daysUntilLost: number;
}

interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinsReward: number;
  category: 'task' | 'streak' | 'card' | 'performance';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  progress: number;
  unlockedAt: string | null;
}

interface Achievements {
  total: number;
  unlocked: number;
  progress: number;
  list: Achievement[];
}

interface Performance {
  taskCompletionRate: number;
  cardCompletionRate: number;
  totalTasksCompleted: number;
  totalCardsCompleted: number;
  criticalCardsCompleted: number;
}

interface UserStats {
  userId: string;
  level: number;
  levelTitle: string;
  levelColor: string;
  xp: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  tasksCompleted: number;
  tasksCompletedOnTime: number;
  cardsCompleted: number;
  cardsCompletedOnTime: number;
  criticalCardsCompleted: number;
}

interface UserStatsResponse {
  stats: UserStats;
  levelProgress: LevelProgress;
  streak: Streak;
  achievements: Achievements;
  performance: Performance;
}

export function useUserStats() {
  const [data, setData] = useState<UserStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/stats/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar estatísticas");
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats: data?.stats || null,
    levelProgress: data?.levelProgress || null,
    streak: data?.streak || null,
    achievements: data?.achievements || null,
    performance: data?.performance || null,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Simplified hook for just basic stats
 */
export function useBasicStats() {
  const { stats, levelProgress, isLoading, error, refetch } = useUserStats();

  return {
    level: stats?.level || 1,
    levelTitle: stats?.levelTitle || 'Iniciante',
    levelColor: stats?.levelColor || '#95E1D3',
    xp: stats?.xp || 0,
    coins: stats?.coins || 0,
    currentStreak: stats?.currentStreak || 0,
    progress: levelProgress?.progressPercentage || 0,
    currentLevelXp: levelProgress?.currentLevelXp || 0,
    xpForNextLevel: levelProgress?.xpForNextLevel || 100,
    isLoading,
    error,
    refetch,
  };
}