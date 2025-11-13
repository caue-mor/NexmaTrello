/**
 * useAchievements - Hook to fetch and manage user achievements
 */

"use client";

import { useEffect, useState } from "react";

interface AchievementDetails {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinsReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  progress: number;
  unlockedAt: string | null;
}

interface RecentAchievement {
  key: string;
  unlockedAt: string;
  title: string;
  icon: string;
  xpReward: number;
  coinsReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface AchievementsSummary {
  total: number;
  unlocked: number;
  progress: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
}

interface AchievementsByCategory {
  task: AchievementDetails[];
  streak: AchievementDetails[];
  card: AchievementDetails[];
  performance: AchievementDetails[];
}

interface AchievementsResponse {
  summary: AchievementsSummary;
  byCategory: AchievementsByCategory;
  recentlyUnlocked: RecentAchievement[];
}

export function useAchievements() {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/achievements/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar conquistas");
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error("Error fetching achievements:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return {
    summary: data?.summary || null,
    byCategory: data?.byCategory || null,
    recentlyUnlocked: data?.recentlyUnlocked || [],
    isLoading,
    error,
    refetch: fetchAchievements,
  };
}

/**
 * Hook to get achievements by specific category
 */
export function useAchievementsByCategory(category: 'task' | 'streak' | 'card' | 'performance') {
  const { byCategory, isLoading, error, refetch } = useAchievements();

  return {
    achievements: byCategory?.[category] || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get only unlocked achievements
 */
export function useUnlockedAchievements() {
  const { byCategory, isLoading, error, refetch } = useAchievements();

  const unlocked = byCategory
    ? [
        ...byCategory.task.filter(a => a.unlocked),
        ...byCategory.streak.filter(a => a.unlocked),
        ...byCategory.card.filter(a => a.unlocked),
        ...byCategory.performance.filter(a => a.unlocked),
      ].sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      })
    : [];

  return {
    achievements: unlocked,
    count: unlocked.length,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get achievements in progress (not unlocked but have progress)
 */
export function useAchievementsInProgress() {
  const { byCategory, isLoading, error, refetch } = useAchievements();

  const inProgress = byCategory
    ? [
        ...byCategory.task.filter(a => !a.unlocked && a.progress > 0),
        ...byCategory.streak.filter(a => !a.unlocked && a.progress > 0),
        ...byCategory.card.filter(a => !a.unlocked && a.progress > 0),
        ...byCategory.performance.filter(a => !a.unlocked && a.progress > 0),
      ].sort((a, b) => b.progress - a.progress)
    : [];

  return {
    achievements: inProgress,
    count: inProgress.length,
    isLoading,
    error,
    refetch,
  };
}