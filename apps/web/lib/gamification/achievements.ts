/**
 * Achievements System - Lista de conquistas e suas condições
 */

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinsReward?: number;
  condition: (stats: AchievementStats) => boolean;
  category: 'task' | 'streak' | 'card' | 'performance';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface AchievementStats {
  tasksCompleted: number;
  tasksCompletedOnTime: number;
  cardsCompleted: number;
  cardsCompletedOnTime: number;
  criticalCardsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
}

/**
 * All available achievements
 */
export const ACHIEVEMENTS: Achievement[] = [
  // Task-based achievements (Valores balanceados: 1 XP = 1 tarefa)
  {
    key: 'first_task',
    title: 'Primeira Tarefa',
    description: 'Complete sua primeira tarefa',
    icon: '🎯',
    xpReward: 5, // +5 XP bônus (equivale a 5 tarefas)
    coinsReward: 2,
    condition: (stats) => stats.tasksCompleted >= 1,
    category: 'task',
    tier: 'bronze',
  },
  {
    key: 'productive_10',
    title: 'Produtivo',
    description: 'Complete 10 tarefas',
    icon: '⚡',
    xpReward: 10, // +10 XP bônus (10% do esforço)
    coinsReward: 3,
    condition: (stats) => stats.tasksCompleted >= 10,
    category: 'task',
    tier: 'bronze',
  },
  {
    key: 'veteran_100',
    title: 'Veterano',
    description: 'Complete 100 tarefas',
    icon: '🏆',
    xpReward: 50, // +50 XP bônus (50% do nível 1→2)
    coinsReward: 15,
    condition: (stats) => stats.tasksCompleted >= 100,
    category: 'task',
    tier: 'silver',
  },
  {
    key: 'master_500',
    title: 'Mestre das Tarefas',
    description: 'Complete 500 tarefas',
    icon: '👑',
    xpReward: 150, // +150 XP bônus (significativo)
    coinsReward: 30,
    condition: (stats) => stats.tasksCompleted >= 500,
    category: 'task',
    tier: 'gold',
  },

  // Performance-based achievements
  {
    key: 'punctual_10',
    title: 'Pontual',
    description: 'Complete 10 tarefas no prazo',
    icon: '⏰',
    xpReward: 20, // +20 XP bônus (recompensa por pontualidade)
    coinsReward: 5,
    condition: (stats) => stats.tasksCompletedOnTime >= 10,
    category: 'performance',
    tier: 'bronze',
  },
  {
    key: 'perfectionist',
    title: 'Perfeccionista',
    description: 'Complete 5 cards com 100% das tarefas',
    icon: '💯',
    xpReward: 15, // +15 XP bônus
    coinsReward: 5,
    condition: (stats) => stats.cardsCompleted >= 5,
    category: 'card',
    tier: 'bronze',
  },
  {
    key: 'urgent_5',
    title: 'Sob Pressão',
    description: 'Complete 5 cards críticos',
    icon: '🔥',
    xpReward: 25, // +25 XP bônus (cards críticos são difíceis)
    coinsReward: 8,
    condition: (stats) => stats.criticalCardsCompleted >= 5,
    category: 'card',
    tier: 'silver',
  },

  // Streak-based achievements
  {
    key: 'fire_streak_7',
    title: 'Em Chamas',
    description: 'Mantenha uma sequência de 7 dias',
    icon: '🔥',
    xpReward: 30, // +30 XP bônus (consistência é valiosa)
    coinsReward: 10,
    condition: (stats) => stats.longestStreak >= 7,
    category: 'streak',
    tier: 'bronze',
  },
  {
    key: 'dedicated_30',
    title: 'Dedicado',
    description: 'Mantenha uma sequência de 30 dias',
    icon: '💪',
    xpReward: 100, // +100 XP bônus (1 nível completo!)
    coinsReward: 25,
    condition: (stats) => stats.longestStreak >= 30,
    category: 'streak',
    tier: 'silver',
  },
  {
    key: 'legend_streak_100',
    title: 'Lendário',
    description: 'Mantenha uma sequência de 100 dias',
    icon: '⭐',
    xpReward: 300, // +300 XP bônus (3 níveis!)
    coinsReward: 50,
    condition: (stats) => stats.longestStreak >= 100,
    category: 'streak',
    tier: 'platinum',
  },
];

/**
 * Get achievement by key
 */
export function getAchievement(key: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.key === key);
}

/**
 * Check which achievements are unlocked based on stats
 */
export function checkUnlockedAchievements(
  stats: AchievementStats,
  currentAchievements: string[]
): Achievement[] {
  return ACHIEVEMENTS.filter(achievement =>
    !currentAchievements.includes(achievement.key) &&
    achievement.condition(stats)
  );
}

/**
 * Get all achievements organized by category
 */
export function getAchievementsByCategory() {
  const categories = {
    task: [] as Achievement[],
    streak: [] as Achievement[],
    card: [] as Achievement[],
    performance: [] as Achievement[],
  };

  ACHIEVEMENTS.forEach(achievement => {
    categories[achievement.category].push(achievement);
  });

  return categories;
}

/**
 * Calculate total possible XP from all achievements
 */
export function getTotalPossibleAchievementXp(): number {
  return ACHIEVEMENTS.reduce((total, achievement) => total + achievement.xpReward, 0);
}

/**
 * Calculate total possible coins from all achievements
 */
export function getTotalPossibleAchievementCoins(): number {
  return ACHIEVEMENTS.reduce((total, achievement) => total + (achievement.coinsReward || 0), 0);
}

/**
 * Get achievement progress
 */
export function getAchievementProgress(
  achievement: Achievement,
  stats: AchievementStats
): number {
  const key = achievement.key;

  // Map achievement keys to their progress calculation
  const progressMap: Record<string, number> = {
    'first_task': Math.min(100, stats.tasksCompleted * 100),
    'productive_10': Math.min(100, (stats.tasksCompleted / 10) * 100),
    'veteran_100': Math.min(100, (stats.tasksCompleted / 100) * 100),
    'master_500': Math.min(100, (stats.tasksCompleted / 500) * 100),
    'punctual_10': Math.min(100, (stats.tasksCompletedOnTime / 10) * 100),
    'perfectionist': Math.min(100, (stats.cardsCompleted / 5) * 100),
    'urgent_5': Math.min(100, (stats.criticalCardsCompleted / 5) * 100),
    'fire_streak_7': Math.min(100, (stats.longestStreak / 7) * 100),
    'dedicated_30': Math.min(100, (stats.longestStreak / 30) * 100),
    'legend_streak_100': Math.min(100, (stats.longestStreak / 100) * 100),
  };

  return progressMap[key] || 0;
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string {
  switch (tier) {
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#C0C0C0';
    case 'gold':
      return '#FFD700';
    case 'platinum':
      return '#E5E4E2';
    default:
      return '#808080';
  }
}

/**
 * Get tier background gradient for UI
 */
export function getTierGradient(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string {
  switch (tier) {
    case 'bronze':
      return 'linear-gradient(135deg, #CD7F32, #8B4513)';
    case 'silver':
      return 'linear-gradient(135deg, #E8E8E8, #A8A8A8)';
    case 'gold':
      return 'linear-gradient(135deg, #FFD700, #FFA500)';
    case 'platinum':
      return 'linear-gradient(135deg, #E5E4E2, #B8B8B8)';
    default:
      return 'linear-gradient(135deg, #808080, #505050)';
  }
}