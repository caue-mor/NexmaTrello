/**
 * Gamification System - Main exports
 */

// XP System
export {
  XP_REWARDS,
  COINS_CONFIG,
  getXpForLevel,
  getTotalXpForLevel,
  getLevelFromXp,
  getLevelProgress,
  calculateCoinsFromXp,
  calculateStreakBonus,
  calculateChecklistItemXp,
  calculateCardCompletionXp,
  formatXp,
  getLevelTitle,
  getLevelColor,
} from './xp-system';

// Achievements
export {
  ACHIEVEMENTS,
  getAchievement,
  checkUnlockedAchievements,
  getAchievementsByCategory,
  getTotalPossibleAchievementXp,
  getTotalPossibleAchievementCoins,
  getAchievementProgress,
  getTierColor,
  getTierGradient,
  type Achievement,
  type AchievementStats,
} from './achievements';

// Streak System
export {
  shouldContinueStreak,
  calculateNewStreak,
  updateStreakStats,
  getStreakMilestone,
  getStreakStatus,
  getDaysUntilStreakLost,
  formatStreak,
} from './streak-system';

// Award XP
export {
  awardXpForChecklistItem,
  ensureUserStats,
  getUserStatsWithAchievements,
  type GamificationResult,
} from './award-xp';