"use client";

import { Trophy, Coins, Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsWidgetProps {
  stats: {
    level: number;
    xp: number;
    xpForNextLevel: number;
    coins: number;
    streak: number;
    tasksCompleted: number;
  } | null;
  loading?: boolean;
}

export function StatsWidget({ stats, loading }: StatsWidgetProps) {
  if (loading || !stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="space-y-4">
          <Skeleton className="h-8 w-32 bg-white/20" />
          <Skeleton className="h-4 w-full bg-white/20" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 bg-white/20" />
            <Skeleton className="h-16 bg-white/20" />
          </div>
        </div>
      </motion.div>
    );
  }

  const xpPercentage = (stats.xp / stats.xpForNextLevel) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Nível {stats.level}</h3>
              <p className="text-sm text-white/80">Continue conquistando!</p>
            </div>
          </div>

          {/* Coins Badge */}
          <div className="flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-300/30">
            <Coins className="w-5 h-5 text-yellow-300" />
            <span className="font-bold text-yellow-100">{stats.coins}</span>
          </div>
        </div>

        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">Progresso de XP</span>
            <span className="font-medium">
              {stats.xp} / {stats.xpForNextLevel} XP
            </span>
          </div>
          <Progress value={xpPercentage} className="h-3 bg-white/20" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Streak */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="text-sm text-white/70">Sequência</span>
            </div>
            <p className="text-2xl font-bold">{stats.streak} dias</p>
          </div>

          {/* Tasks Completed */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-green-300" />
              <span className="text-sm text-white/70">Tarefas</span>
            </div>
            <p className="text-2xl font-bold">{stats.tasksCompleted}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
