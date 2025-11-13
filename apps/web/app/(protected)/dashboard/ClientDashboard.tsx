"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateBoardDialog } from "@/components/boards/CreateBoardDialog";
import { TaskAlerts } from "@/components/alerts/TaskAlerts";
import { StatsWidget } from "@/components/gamification/StatsWidget";
import { AchievementsPanel } from "@/components/gamification/AchievementsPanel";

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
    ],
    stats: {
      totalAchievements: 3,
      unlockedAchievements: 2,
    },
    loading: false,
  };
}

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
  const { stats, loading: statsLoading } = useUserStats();
  const { achievements, stats: achievementStats, loading: achievementsLoading } = useAchievements();

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
        <StatsWidget stats={stats} loading={statsLoading} />

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
          achievements={achievements}
          stats={achievementStats}
          loading={achievementsLoading}
        />
      </div>
    </div>
  );
}
