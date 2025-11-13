/**
 * XP System - Cálculos de XP e level
 *
 * SISTEMA SIMPLIFICADO E BALANCEADO:
 * - 1 XP por tarefa completada
 * - Bônus de 10% ao completar todas as tarefas de um card
 * - Bônus de pontualidade: +5 XP
 * - Bônus crítico: +2 XP
 * - Progressão LINEAR: nível × 100
 *
 * EXEMPLO:
 * - Card com 10 tarefas = 10 XP + 1 XP bônus = 11 XP
 * - Card com 20 tarefas no prazo = 20 XP + 2 XP bônus + 5 XP = 27 XP
 * - Card crítico com 5 tarefas = 5 XP + 1 XP bônus + 2 XP = 8 XP
 */

// XP rewards configuration
export const XP_REWARDS = {
  CHECKLIST_ITEM: 1, // 1 XP por tarefa
  COMPLETE_CARD_BONUS_PERCENT: 0.1, // 10% do total de tarefas (arredondado)
  ON_TIME_BONUS: 5, // +5 XP se completar no prazo
  CRITICAL_BONUS: 2, // +2 XP se card for crítico
} as const;

// Coins configuration
export const COINS_CONFIG = {
  XP_TO_COINS_RATIO: 10, // 1 coin per 10 XP
  STREAK_BONUS_DAYS: 7,   // Bonus every 7 days
  STREAK_BONUS_AMOUNT: 5, // 5 coins per 7-day streak
} as const;

/**
 * Calculate XP required for a specific level
 * Formula LINEAR: level × 100
 *
 * Nível 0 → 1: 100 XP
 * Nível 1 → 2: 200 XP
 * Nível 2 → 3: 300 XP
 * Nível 10 → 11: 1100 XP
 */
export function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  return level * 100;
}

/**
 * Calculate total XP required to reach a level (sum of all previous levels)
 *
 * Nível 1: 0 XP
 * Nível 2: 100 XP
 * Nível 3: 300 XP (100 + 200)
 * Nível 4: 600 XP (100 + 200 + 300)
 */
export function getTotalXpForLevel(level: number): number {
  if (level <= 1) return 0;

  // Soma aritmética: n(n-1)/2 * 100
  return ((level - 1) * level / 2) * 100;
}

/**
 * Calculate current level from total XP
 */
export function getLevelFromXp(totalXp: number): number {
  if (totalXp < 0) return 1;

  let level = 1;
  while (getTotalXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * Calculate progress within current level
 */
export function getLevelProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progress: number;
} {
  const level = getLevelFromXp(totalXp);
  const xpForCurrentLevel = getTotalXpForLevel(level);
  const xpForNextLevel = getXpForLevel(level);
  const currentLevelXp = totalXp - xpForCurrentLevel;
  const progress = xpForNextLevel > 0 ? (currentLevelXp / xpForNextLevel) * 100 : 0;

  return {
    level,
    currentLevelXp,
    xpForNextLevel,
    progress: Math.min(100, Math.max(0, Math.round(progress))),
  };
}

/**
 * Calculate coins earned from XP
 */
export function calculateCoinsFromXp(xpGained: number): number {
  return Math.floor(xpGained / COINS_CONFIG.XP_TO_COINS_RATIO);
}

/**
 * Calculate streak bonus coins
 */
export function calculateStreakBonus(currentStreak: number, previousStreak: number): number {
  const currentMilestone = Math.floor(currentStreak / COINS_CONFIG.STREAK_BONUS_DAYS);
  const previousMilestone = Math.floor(previousStreak / COINS_CONFIG.STREAK_BONUS_DAYS);

  if (currentMilestone > previousMilestone) {
    return COINS_CONFIG.STREAK_BONUS_AMOUNT * (currentMilestone - previousMilestone);
  }

  return 0;
}

/**
 * Calculate XP for completing a checklist item
 * 1 XP base (sem multiplicadores por urgência)
 */
export function calculateChecklistItemXp(): number {
  return XP_REWARDS.CHECKLIST_ITEM;
}

/**
 * Calculate XP for completing a card
 * Bônus: 10% do total de tarefas + bônus de pontualidade + bônus crítico
 */
export function calculateCardCompletionXp(
  totalTasks: number,
  card: {
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dueAt?: Date | null;
    completedAt?: Date | null;
  }
): number {
  // Bônus base: 10% das tarefas (arredondado)
  let xp = Math.round(totalTasks * XP_REWARDS.COMPLETE_CARD_BONUS_PERCENT);

  // Bônus de pontualidade
  const completedOnTime = card.dueAt && card.completedAt && card.completedAt <= card.dueAt;
  if (completedOnTime) {
    xp += XP_REWARDS.ON_TIME_BONUS;
  }

  // Bônus crítico
  if (card.urgency === 'CRITICAL') {
    xp += XP_REWARDS.CRITICAL_BONUS;
  }

  return xp;
}

/**
 * Format XP display
 */
export function formatXp(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

/**
 * Get level title based on level number
 */
export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Lenda';
  if (level >= 75) return 'Mestre';
  if (level >= 50) return 'Expert';
  if (level >= 30) return 'Veterano';
  if (level >= 20) return 'Avançado';
  if (level >= 10) return 'Intermediário';
  if (level >= 5) return 'Aprendiz';
  return 'Iniciante';
}

/**
 * Get level color for UI
 */
export function getLevelColor(level: number): string {
  if (level >= 100) return '#FFD700'; // Gold
  if (level >= 75) return '#FF6B6B';  // Red
  if (level >= 50) return '#C77DFF';  // Purple
  if (level >= 30) return '#7209B7';  // Dark Purple
  if (level >= 20) return '#4361EE';  // Blue
  if (level >= 10) return '#4CC9F0';  // Cyan
  if (level >= 5) return '#4ECDC4';   // Teal
  return '#95E1D3';                    // Light Teal
}
