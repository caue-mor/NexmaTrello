"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "tasks" | "punctuality" | "streak" | "special";
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface AchievementsPanelProps {
  achievements: Achievement[];
  stats: {
    totalAchievements: number;
    unlockedAchievements: number;
  };
  loading?: boolean;
}

const categoryLabels = {
  tasks: "Tarefas",
  punctuality: "Pontualidade",
  streak: "Sequência",
  special: "Especial",
};

export function AchievementsPanel({
  achievements,
  stats,
  loading,
}: AchievementsPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-64" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-neutral-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Conquistas
        </h2>
        <p className="text-neutral-600">
          {stats.unlockedAchievements} de {stats.totalAchievements}{" "}
          desbloqueadas
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedAchievements).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((achievement, index) => {
                const IconComponent =
                  LucideIcons[
                    achievement.icon as keyof typeof LucideIcons
                  ] as LucideIcons.LucideIcon;

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: achievement.unlocked ? 1.05 : 1 }}
                    className={cn(
                      "relative rounded-xl p-4 border transition-all",
                      achievement.unlocked
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-sm"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                        achievement.unlocked
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      )}
                    >
                      {IconComponent && <IconComponent className="w-6 h-6" />}
                    </div>

                    {/* Content */}
                    <h4
                      className={cn(
                        "font-semibold text-sm mb-1",
                        achievement.unlocked ? "text-neutral-900" : "text-gray-500"
                      )}
                    >
                      {achievement.title}
                    </h4>

                    <p
                      className={cn(
                        "text-xs mb-3",
                        achievement.unlocked ? "text-neutral-600" : "text-gray-400"
                      )}
                    >
                      {achievement.description}
                    </p>

                    {/* XP Badge */}
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        achievement.unlocked
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      +{achievement.xpReward} XP
                    </div>

                    {/* Unlocked Badge */}
                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <LucideIcons.Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
