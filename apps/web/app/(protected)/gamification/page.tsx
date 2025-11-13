"use client";

import { StatsWidget } from "@/components/gamification/StatsWidget";
import { AchievementsPanel } from "@/components/gamification/AchievementsPanel";
import { Trophy, Target, Zap, Calendar, Star } from "lucide-react";

// Mock hooks - will be replaced with real hooks
function useUserStats() {
  return {
    stats: {
      level: 5,
      xp: 350,
      xpForNextLevel: 500,
      coins: 120,
      streak: 7,
      tasksCompleted: 42,
    },
    loading: false,
    error: null,
  };
}

function useAchievements() {
  return {
    achievements: [
      {
        id: "1",
        title: "Primeira Tarefa",
        description: "Complete sua primeira tarefa",
        icon: "CheckCircle",
        category: "tasks" as const,
        xpReward: 10,
        unlocked: true,
        unlockedAt: new Date(),
      },
      {
        id: "2",
        title: "Produtivo",
        description: "Complete 10 tarefas",
        icon: "Target",
        category: "tasks" as const,
        xpReward: 50,
        unlocked: true,
        unlockedAt: new Date(),
      },
      {
        id: "3",
        title: "Pontual",
        description: "Complete 5 tarefas no prazo",
        icon: "Clock",
        category: "punctuality" as const,
        xpReward: 30,
        unlocked: false,
      },
      {
        id: "4",
        title: "Sequência de 7",
        description: "Mantenha uma sequência de 7 dias",
        icon: "Flame",
        category: "streak" as const,
        xpReward: 100,
        unlocked: true,
        unlockedAt: new Date(),
      },
    ],
    stats: {
      totalAchievements: 4,
      unlockedAchievements: 3,
    },
    loading: false,
  };
}

export default function GamificationPage() {
  const { stats, loading: statsLoading } = useUserStats();
  const { achievements, stats: achievementStats, loading: achievementsLoading } = useAchievements();

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Seu Progresso
          </h1>
          <p className="text-neutral-600">
            Acompanhe seu nível, conquistas e recompensas
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats Widget - 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <StatsWidget stats={stats} loading={statsLoading} />
          </div>

          {/* How to Earn XP - 1/3 width on large screens */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Como Ganhar XP
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    Completar tarefa
                  </p>
                  <p className="text-xs text-neutral-600">+10 XP</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    Completar card
                  </p>
                  <p className="text-xs text-neutral-600">+50 XP</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    No prazo
                  </p>
                  <p className="text-xs text-neutral-600">+50 XP bônus</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    Card crítico
                  </p>
                  <p className="text-xs text-neutral-600">2x XP</p>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">
                  Continue completando tarefas e cards para subir de nível e
                  desbloquear conquistas!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <AchievementsPanel
          achievements={achievements}
          stats={achievementStats}
          loading={achievementsLoading}
        />
      </div>
    </div>
  );
}
