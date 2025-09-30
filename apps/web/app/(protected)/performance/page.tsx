import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function PerformancePage() {
  const user = await requireAuth();

  // Cards atribuídos ao usuário
  const assignedCards = await prisma.cardAssignee.findMany({
    where: { userId: user.id },
    include: {
      card: {
        include: {
          column: {
            select: { title: true },
          },
          board: {
            select: { title: true },
          },
          checklists: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  // Calcular estatísticas
  const totalCards = assignedCards.length;

  let totalTasks = 0;
  let completedTasks = 0;
  let cardsCompleted = 0;
  let cardsOverdue = 0;

  const now = new Date();

  assignedCards.forEach((assignment) => {
    const card = assignment.card;

    // Contar tarefas de checklist
    card.checklists.forEach((checklist) => {
      checklist.items.forEach((item) => {
        totalTasks++;
        if (item.isChecked) completedTasks++;
      });
    });

    // Cards completos (100% das checklists)
    const cardTasks = card.checklists.flatMap((c) => c.items);
    if (cardTasks.length > 0) {
      const cardCompleted = cardTasks.every((item) => item.isChecked);
      if (cardCompleted) cardsCompleted++;
    }

    // Cards atrasados
    if (card.dueAt && card.dueAt < now) {
      const isComplete = cardTasks.length > 0 && cardTasks.every((item) => item.isChecked);
      if (!isComplete) cardsOverdue++;
    }
  });

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const cardCompletionRate = totalCards > 0 ? (cardsCompleted / totalCards) * 100 : 0;

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-600 hover:text-black transition mb-4 inline-block"
          >
            ← Voltar para Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Minha Performance</h1>
          <p className="text-neutral-600">
            Acompanhe suas métricas e progresso nas tarefas
          </p>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Cards Atribuídos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-sm font-medium text-neutral-600">
                Cards Atribuídos
              </h3>
            </div>
            <p className="text-3xl font-bold">{totalCards}</p>
          </div>

          {/* Taxa de Conclusão de Tarefas */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <h3 className="text-sm font-medium text-neutral-600">
                Taxa de Conclusão
              </h3>
            </div>
            <p className="text-3xl font-bold">{completionRate.toFixed(0)}%</p>
            <p className="text-xs text-neutral-500 mt-1">
              {completedTasks} de {totalTasks} tarefas
            </p>
          </div>

          {/* Cards Completos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <h3 className="text-sm font-medium text-neutral-600">
                Cards Completos
              </h3>
            </div>
            <p className="text-3xl font-bold">{cardsCompleted}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {cardCompletionRate.toFixed(0)}% dos cards
            </p>
          </div>

          {/* Cards Atrasados */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <h3 className="text-sm font-medium text-neutral-600">
                Cards Atrasados
              </h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{cardsOverdue}</p>
          </div>
        </div>

        {/* Lista de Cards */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <h2 className="text-xl font-bold mb-4">Meus Cards</h2>

          {assignedCards.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-lg mb-2">Nenhum card atribuído</p>
              <p className="text-sm">
                Você será notificado quando for atribuído a novos cards
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedCards.map((assignment) => {
                const card = assignment.card;
                const tasks = card.checklists.flatMap((c) => c.items);
                const completedTaskCount = tasks.filter((t) => t.isChecked).length;
                const progress = tasks.length > 0 ? (completedTaskCount / tasks.length) * 100 : 0;
                const isComplete = tasks.length > 0 && tasks.every((t) => t.isChecked);
                const isOverdue = card.dueAt && card.dueAt < now && !isComplete;

                return (
                  <div
                    key={assignment.id}
                    className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{card.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span>📊 {card.board.title}</span>
                          <span>•</span>
                          <span>📂 {card.column.title}</span>
                        </div>
                      </div>
                      {isComplete && (
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                          ✓ Completo
                        </span>
                      )}
                      {isOverdue && (
                        <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
                          ⚠️ Atrasado
                        </span>
                      )}
                    </div>

                    {card.description && (
                      <p className="text-sm text-neutral-600 mb-3">
                        {card.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {tasks.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                          <span>Progresso</span>
                          <span>
                            {completedTaskCount}/{tasks.length} tarefas
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isComplete ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {card.dueAt && (
                      <p className="text-xs text-neutral-500">
                        📅 Prazo: {new Date(card.dueAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}