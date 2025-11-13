/**
 * Streak System - Sistema de dias consecutivos
 */

import { differenceInDays, startOfDay, isToday, isYesterday } from 'date-fns';

/**
 * Check if the streak should continue based on last active date
 */
export function shouldContinueStreak(lastActiveDate: Date | null): boolean {
  if (!lastActiveDate) {
    return true; // First activity starts a streak
  }

  const today = startOfDay(new Date());
  const lastActive = startOfDay(lastActiveDate);

  // If last active was today, streak continues
  if (isToday(lastActive)) {
    return true;
  }

  // If last active was yesterday, streak continues
  if (isYesterday(lastActive)) {
    return true;
  }

  // Otherwise, streak is broken
  return false;
}

/**
 * Calculate the new streak value
 */
export function calculateNewStreak(
  currentStreak: number,
  lastActiveDate: Date | null
): number {
  if (!lastActiveDate) {
    return 1; // First activity
  }

  const today = startOfDay(new Date());
  const lastActive = startOfDay(lastActiveDate);

  // If already active today, keep current streak
  if (isToday(lastActive)) {
    return currentStreak;
  }

  // If last active was yesterday, increment streak
  if (isYesterday(lastActive)) {
    return currentStreak + 1;
  }

  // Streak was broken, start new one
  return 1;
}

/**
 * Update streak stats
 */
export function updateStreakStats(
  currentStats: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
  }
): {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  streakChanged: boolean;
} {
  const now = new Date();
  const today = startOfDay(now);
  const lastActive = currentStats.lastActiveDate ? startOfDay(currentStats.lastActiveDate) : null;

  // If already active today, no change
  if (lastActive && isToday(lastActive)) {
    return {
      currentStreak: currentStats.currentStreak,
      longestStreak: currentStats.longestStreak,
      lastActiveDate: now,
      streakChanged: false,
    };
  }

  // Calculate new streak
  const newStreak = calculateNewStreak(currentStats.currentStreak, currentStats.lastActiveDate);
  const newLongestStreak = Math.max(newStreak, currentStats.longestStreak);

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastActiveDate: now,
    streakChanged: true,
  };
}

/**
 * Get streak milestone rewards
 */
export function getStreakMilestone(streak: number): {
  milestone: number;
  nextMilestone: number;
  reward: { coins: number; xp: number };
} | null {
  const milestones = [
    { days: 7, coins: 10, xp: 50 },
    { days: 14, coins: 20, xp: 100 },
    { days: 30, coins: 50, xp: 200 },
    { days: 60, coins: 100, xp: 400 },
    { days: 90, coins: 150, xp: 600 },
    { days: 100, coins: 200, xp: 1000 },
    { days: 180, coins: 300, xp: 1500 },
    { days: 365, coins: 500, xp: 2500 },
  ];

  // Check if we hit a milestone today
  const milestone = milestones.find(m => m.days === streak);
  if (milestone) {
    const nextMilestoneData = milestones.find(m => m.days > streak);
    return {
      milestone: milestone.days,
      nextMilestone: nextMilestoneData?.days || streak + 7,
      reward: { coins: milestone.coins, xp: milestone.xp },
    };
  }

  // Find next milestone
  const nextMilestoneData = milestones.find(m => m.days > streak);
  return {
    milestone: 0,
    nextMilestone: nextMilestoneData?.days || Math.ceil(streak / 7) * 7 + 7,
    reward: { coins: 0, xp: 0 },
  };
}

/**
 * Get streak status for UI display
 */
export function getStreakStatus(streak: number): {
  emoji: string;
  title: string;
  color: string;
} {
  if (streak === 0) {
    return {
      emoji: '💤',
      title: 'Sem sequência',
      color: '#6B7280',
    };
  }

  if (streak < 7) {
    return {
      emoji: '✨',
      title: 'Começando',
      color: '#10B981',
    };
  }

  if (streak < 30) {
    return {
      emoji: '🔥',
      title: 'Em chamas',
      color: '#F59E0B',
    };
  }

  if (streak < 60) {
    return {
      emoji: '💪',
      title: 'Imparável',
      color: '#EF4444',
    };
  }

  if (streak < 100) {
    return {
      emoji: '🚀',
      title: 'Incrível',
      color: '#8B5CF6',
    };
  }

  if (streak < 365) {
    return {
      emoji: '⭐',
      title: 'Lendário',
      color: '#EC4899',
    };
  }

  return {
    emoji: '👑',
    title: 'Imortal',
    color: '#FFD700',
  };
}

/**
 * Calculate days until streak is lost
 */
export function getDaysUntilStreakLost(lastActiveDate: Date | null): number {
  if (!lastActiveDate) {
    return 1; // No activity yet, 1 day to maintain
  }

  const today = startOfDay(new Date());
  const lastActive = startOfDay(lastActiveDate);

  // If active today, have until tomorrow
  if (isToday(lastActive)) {
    return 1;
  }

  // If active yesterday, need to be active today
  if (isYesterday(lastActive)) {
    return 0;
  }

  // Streak is already lost
  return -1;
}

/**
 * Format streak display
 */
export function formatStreak(streak: number): string {
  if (streak === 0) {
    return 'Sem sequência';
  }

  if (streak === 1) {
    return '1 dia';
  }

  return `${streak} dias`;
}