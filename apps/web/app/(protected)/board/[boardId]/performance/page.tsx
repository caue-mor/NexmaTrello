import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertBoardRole } from "@/lib/rbac";
import Link from "next/link";
import { notFound } from "next/navigation";

interface MemberPerformance {
  userId: string;
  userName: string;
  userEmail: string;
  totalCards: number;
  completedCards: number;
  totalTasks: number;
  completedTasks: number;
  overdueCards: number;
  completionRate: number;
}

export default async function BoardPerformancePage({
  params,
}: {
  params: Promise<{ boardId: string }> | { boardId: string };
}) {
  const user = await requireAuth();
  const resolvedParams = await Promise.resolve(params);
  const { boardId } = resolvedParams;

  // Verificar permissão - apenas OWNER e ADMIN podem ver performance geral
  const memberRole = await assertBoardRole(boardId, user.id, ["OWNER", "ADMIN"]);

  if (!memberRole) {
    notFound();
  }

  const isOwnerOrAdmin = memberRole.role === "OWNER" || memberRole.role === "ADMIN";

  if (!isOwnerOrAdmin) {
    notFound();
  }

  // Buscar informações do board
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      title: true,
      ownerId: true,
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  // Buscar todos os membros do board
  const boardMembers = await prisma.boardMember.findMany({
    where: { boardId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Calcular performance de cada membro
  const memberPerformances: MemberPerformance[] = await Promise.all(
    boardMembers.map(async (member) => {
      const userId = member.user.id;

      // Cards atribuídos ao membro neste board
      const assignedCards = await prisma.cardAssignee.findMany({
        where: {
          userId,
          card: {
            boardId,
          },
        },
        include: {
          card: {
            include: {
              checklists: {
                include: {
                  items: true,
                },
              },
            },
          },
        },
      });

      let totalTasks = 0;
      let completedTasks = 0;
      let completedCards = 0;
      let overdueCards = 0;

      const now = new Date();

      assignedCards.forEach((assignment) => {
        const card = assignment.card;

        // Contar tarefas de checklist
        card.checklists.forEach((checklist) => {
          checklist.items.forEach((item) => {
            totalTasks++;
            if (item.done) completedTasks++;
          });
        });

        // Cards completos (100% das checklists)
        const cardTasks = card.checklists.flatMap((c) => c.items);
        if (cardTasks.length > 0) {
          const cardCompleted = cardTasks.every((item) => item.done);
          if (cardCompleted) completedCards++;
        }

        // Cards atrasados
        if (card.dueAt && card.dueAt < now) {
          const isComplete = cardTasks.length > 0 && cardTasks.every((item) => item.done);
          if (!isComplete) overdueCards++;
        }
      });

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        userId,
        userName: member.user.name || "Sem nome",
        userEmail: member.user.email,
        totalCards: assignedCards.length,
        completedCards,
        totalTasks,
        completedTasks,
        overdueCards,
        completionRate,
      };
    })
  );

  // Calcular estatísticas gerais do board
  const totalBoardCards = memberPerformances.reduce((sum, m) => sum + m.totalCards, 0);
  const totalBoardTasks = memberPerformances.reduce((sum, m) => sum + m.totalTasks, 0);
  const totalCompletedTasks = memberPerformances.reduce((sum, m) => sum + m.completedTasks, 0);
  const totalCompletedCards = memberPerformances.reduce((sum, m) => sum + m.completedCards, 0);
  const totalOverdueCards = memberPerformances.reduce((sum, m) => sum + m.overdueCards, 0);
  const boardCompletionRate = totalBoardTasks > 0 ? (totalCompletedTasks / totalBoardTasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/board/${boardId}`}
            className="text-sm text-neutral-600 hover:text-black transition mb-4 inline-block"
          >
            ← Voltar para Board
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Performance do Board</h1>
              <p className="text-neutral-600">{board.title}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">Owner</p>
              <p className="font-medium">{board.owner.name || board.owner.email}</p>
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais do Board */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📊 Visão Geral do Grupo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total de Membros */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <h3 className="text-sm font-medium text-neutral-600">Membros</h3>
              </div>
              <p className="text-3xl font-bold">{memberPerformances.length}</p>
            </div>

            {/* Cards Atribuídos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <h3 className="text-sm font-medium text-neutral-600">Cards Atribuídos</h3>
              </div>
              <p className="text-3xl font-bold">{totalBoardCards}</p>
            </div>

            {/* Taxa de Conclusão */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
                <h3 className="text-sm font-medium text-neutral-600">Taxa de Conclusão</h3>
              </div>
              <p className="text-3xl font-bold">{boardCompletionRate.toFixed(0)}%</p>
              <p className="text-xs text-neutral-500 mt-1">
                {totalCompletedTasks} de {totalBoardTasks} tarefas
              </p>
            </div>

            {/* Cards Completos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <h3 className="text-sm font-medium text-neutral-600">Cards Completos</h3>
              </div>
              <p className="text-3xl font-bold">{totalCompletedCards}</p>
            </div>

            {/* Cards Atrasados */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <h3 className="text-sm font-medium text-neutral-600">Cards Atrasados</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">{totalOverdueCards}</p>
            </div>
          </div>
        </div>

        {/* Performance Individual dos Membros */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <h2 className="text-2xl font-bold mb-6">👤 Performance Individual</h2>

          {memberPerformances.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-lg mb-2">Nenhum membro encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memberPerformances
                .sort((a, b) => b.completionRate - a.completionRate)
                .map((member) => (
                  <div
                    key={member.userId}
                    className="border border-neutral-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    {/* Cabeçalho do Membro */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {member.userName[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{member.userName}</h3>
                          <p className="text-sm text-neutral-500">{member.userEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{member.completionRate.toFixed(0)}%</p>
                        <p className="text-xs text-neutral-500">Taxa de Conclusão</p>
                      </div>
                    </div>

                    {/* Estatísticas do Membro */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{member.totalCards}</p>
                        <p className="text-xs text-neutral-600 mt-1">Cards Atribuídos</p>
                      </div>
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{member.completedCards}</p>
                        <p className="text-xs text-neutral-600 mt-1">Cards Completos</p>
                      </div>
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{member.totalTasks}</p>
                        <p className="text-xs text-neutral-600 mt-1">Total de Tarefas</p>
                      </div>
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-2xl font-bold text-teal-600">{member.completedTasks}</p>
                        <p className="text-xs text-neutral-600 mt-1">Tarefas Concluídas</p>
                      </div>
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{member.overdueCards}</p>
                        <p className="text-xs text-neutral-600 mt-1">Cards Atrasados</p>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="mt-4">
                      <div className="w-full bg-neutral-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500 transition-all"
                          style={{ width: `${member.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}