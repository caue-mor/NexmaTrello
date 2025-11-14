"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateBoardDialog } from "@/components/boards/CreateBoardDialog";
import { TaskAlerts } from "@/components/alerts/TaskAlerts";
import { StatsWidget } from "@/components/gamification/StatsWidget";
import { AchievementsPanel } from "@/components/gamification/AchievementsPanel";
import { useUserStats } from "@/lib/hooks/use-user-stats";

interface ClientDashboardProps {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  boards: Array<{
    id: string;
    title: string;
    isOrgWide: boolean;
    _count: {
      cards: number;
      columns: number;
      members: number;
    };
  }>;
  overdueCards: any[];
  dueTodayCards: any[];
  dueSoonCards: any[];
}

export function ClientDashboard({
  user,
  boards,
  overdueCards,
  dueTodayCards,
  dueSoonCards,
}: ClientDashboardProps) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Seus Grupos</h1>
            <p className="text-neutral-600 mt-1">
              Olá, {user.name || user.email}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/inbox">
              <Button variant="outline">Notificações</Button>
            </Link>
            <CreateBoardDialog />
          </div>
        </div>

        {/* Stats Widget */}
        <StatsWidget stats={statsForWidget} loading={isLoading} />

        {/* Alertas de Tarefas */}
        <TaskAlerts
          overdueCards={overdueCards}
          dueTodayCards={dueTodayCards}
          dueSoonCards={dueSoonCards}
          showBoardInfo={true}
        />

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">
              Você ainda não tem nenhum grupo
            </p>
            <CreateBoardDialog />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/board/${board.id}`}
                className="block"
              >
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                      {board.isOrgWide ? "Trello Geral" : "Grupo"}
                    </div>
                  </div>
                  <div className="text-xl font-semibold mb-2">
                    {board.title}
                  </div>
                  <div className="flex gap-4 text-sm text-neutral-600">
                    <span>{board._count.cards} cards</span>
                    <span>{board._count.columns} colunas</span>
                    <span>{board._count.members} membros</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Achievements Panel */}
        <AchievementsPanel
          achievements={achievementsForPanel}
          stats={achievementStats}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
