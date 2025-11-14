"use client";

import { StatsWidget } from "@/components/gamification/StatsWidget";
import { AchievementsPanel } from "@/components/gamification/AchievementsPanel";
import { Trophy, Target, Zap, Calendar, Star } from "lucide-react";
import { useUserStats } from "@/lib/hooks/use-user-stats";

export default function GamificationPage() {
  const {
    stats,
    levelProgress,
    streak,
    achievements: achievementsData,
    isLoading
  } = useUserStats();

  // Adapt data for StatsWidget
  const statsForWidget = stats && levelProgress && streak ? {
    level: stats.level,
    xp: levelProgress.currentLevelXp,
    xpForNextLevel: levelProgress.xpForNextLevel,
    coins: stats.coins,
    streak: streak.current,
    tasksCompleted: stats.tasksCompleted,
  } : null;

  // Adapt data for AchievementsPanel
  const achievementsForPanel = achievementsData?.list || [];
  const achievementStats = {
    totalAchievements: achievementsData?.total || 0,
    unlockedAchievements: achievementsData?.unlocked || 0,
  };

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
            <StatsWidget stats={statsForWidget} loading={isLoading} />
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
          achievements={achievementsForPanel}
          stats={achievementStats}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
