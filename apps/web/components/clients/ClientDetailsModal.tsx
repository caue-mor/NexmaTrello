"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Client {
  id: string;
  name: string;
  status: string;
  lead: number;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  sector?: string | null;
  region?: string | null;
  notes?: string | null;
  firstContact?: Date | null;
  lastContact?: Date | null;
  cards: {
    id: string;
    title: string;
    createdAt?: Date;
    completedAt?: Date | null;
    column: {
      title: string;
    };
    checklists: {
      id: string;
      title: string;
      items: {
        id: string;
        content: string;
        done: boolean;
      }[];
    }[];
    assignees: {
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    }[];
  }[];
}

interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  metadata?: {
    cardTitle?: string;
    fromColumn?: string;
    toColumn?: string;
  };
}

// Utility function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "há alguns segundos";
  if (diffMin < 60) return `há ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
  if (diffHour < 24) return `há ${diffHour} ${diffHour === 1 ? "hora" : "horas"}`;
  if (diffDay < 7) return `há ${diffDay} ${diffDay === 1 ? "dia" : "dias"}`;
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `há ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }
  if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `há ${months} ${months === 1 ? "mês" : "meses"}`;
  }
  const years = Math.floor(diffDay / 365);
  return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}

// Get activity icon based on type
function getActivityIcon(type: string): string {
  switch (type) {
    case "CARD_CREATED":
    case "CLIENT_CREATED":
      return "📝";
    case "CARD_MOVED":
      return "↔️";
    case "CARD_COMPLETED":
      return "✅";
    case "COMMENT_ADDED":
      return "💬";
    case "CHECKLIST_UPDATED":
      return "☑️";
    case "CARD_ASSIGNED":
      return "👤";
    default:
      return "📌";
  }
}

// Get activity color based on type
function getActivityColor(type: string): string {
  switch (type) {
    case "CARD_CREATED":
    case "CLIENT_CREATED":
      return "bg-blue-100 text-blue-600";
    case "CARD_MOVED":
      return "bg-purple-100 text-purple-600";
    case "CARD_COMPLETED":
      return "bg-green-100 text-green-600";
    case "COMMENT_ADDED":
      return "bg-yellow-100 text-yellow-600";
    case "CHECKLIST_UPDATED":
      return "bg-indigo-100 text-indigo-600";
    case "CARD_ASSIGNED":
      return "bg-pink-100 text-pink-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function ClientDetailsModal({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    // Fetch client data
    fetch(`/api/clients/${clientId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setClient(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    // Fetch activities
    fetch(`/api/clients/${clientId}/activities?limit=10`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        // Se a API retornar erro (501), usar array vazio
        setActivities(Array.isArray(data) ? data : []);
        setLoadingActivities(false);
      })
      .catch((err) => {
        console.error(err);
        setActivities([]); // Garantir array vazio em caso de erro
        setLoadingActivities(false);
      });
  }, [clientId]);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <div className="text-center py-8">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!client) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <div className="text-center py-8">Cliente não encontrado</div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalChecklistItems = client.cards.reduce(
    (acc, card) =>
      acc + card.checklists.reduce((acc2, cl) => acc2 + cl.items.length, 0),
    0
  );

  const doneChecklistItems = client.cards.reduce(
    (acc, card) =>
      acc +
      card.checklists.reduce(
        (acc2, cl) => acc2 + cl.items.filter((i) => i.done).length,
        0
      ),
    0
  );

  const progress =
    totalChecklistItems > 0
      ? Math.round((doneChecklistItems / totalChecklistItems) * 100)
      : 0;

  // Calculate average response time for completed cards
  const completedCards = client.cards.filter(
    (card) => card.createdAt && card.completedAt
  );
  const avgResponseTime =
    completedCards.length > 0
      ? completedCards.reduce((acc, card) => {
          const created = new Date(card.createdAt!).getTime();
          const completed = new Date(card.completedAt!).getTime();
          return acc + (completed - created);
        }, 0) / completedCards.length
      : 0;

  const avgResponseDays =
    avgResponseTime > 0 ? Math.round(avgResponseTime / (1000 * 60 * 60 * 24)) : 0;

  const statusColors = {
    NORMAL: "bg-blue-100 text-blue-700",
    NEUTRO: "bg-gray-100 text-gray-700",
    URGENTE: "bg-orange-100 text-orange-700",
    EMERGENCIA: "bg-red-100 text-red-700",
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Cliente */}
          <div>
            <h3 className="font-semibold mb-3">Informações do Cliente</h3>
            <div className="space-y-3">
              {/* Status and Lead */}
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    statusColors[client.status as keyof typeof statusColors]
                  }`}
                >
                  {client.status}
                </span>
                <span className="text-sm text-neutral-600">Lead: {client.lead}</span>
              </div>

              {/* Additional Fields - Grid Layout */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 rounded-lg p-4">
                {client.phone && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Telefone</p>
                    <p className="text-sm font-medium">{client.phone}</p>
                  </div>
                )}
                {client.email && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Email</p>
                    <p className="text-sm font-medium">{client.email}</p>
                  </div>
                )}
                {client.document && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Documento</p>
                    <p className="text-sm font-medium">{client.document}</p>
                  </div>
                )}
                {client.sector && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Setor</p>
                    <p className="text-sm font-medium">{client.sector}</p>
                  </div>
                )}
                {client.region && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Região</p>
                    <p className="text-sm font-medium">{client.region}</p>
                  </div>
                )}
                {client.firstContact && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Primeira Interação</p>
                    <p className="text-sm font-medium">
                      {new Date(client.firstContact).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                {client.lastContact && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Última Interação</p>
                    <p className="text-sm font-medium">
                      {new Date(client.lastContact).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {client.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-medium mb-1">Notas</p>
                  <p className="text-sm text-amber-900">{client.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Métricas Gerais */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Métricas de Atendimento</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-neutral-600">Cards Vinculados</p>
                <p className="text-2xl font-bold">{client.cards.length}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Tarefas Concluídas</p>
                <p className="text-2xl font-bold">
                  {doneChecklistItems}/{totalChecklistItems}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Progresso</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
              {avgResponseDays > 0 && (
                <div>
                  <p className="text-sm text-neutral-600">Tempo Médio</p>
                  <p className="text-2xl font-bold">
                    {avgResponseDays}
                    <span className="text-sm font-normal"> dias</span>
                  </p>
                </div>
              )}
            </div>
            <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Cards Vinculados */}
          <div>
            <h3 className="font-semibold mb-3">Cards Vinculados</h3>
            {client.cards.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">
                Nenhum card vinculado a este cliente
              </p>
            ) : (
              <div className="space-y-3">
                {client.cards.map((card) => {
                  const cardTotalItems = card.checklists.reduce(
                    (acc, cl) => acc + cl.items.length,
                    0
                  );
                  const cardDoneItems = card.checklists.reduce(
                    (acc, cl) => acc + cl.items.filter((i) => i.done).length,
                    0
                  );
                  const cardProgress =
                    cardTotalItems > 0
                      ? Math.round((cardDoneItems / cardTotalItems) * 100)
                      : 0;

                  return (
                    <div
                      key={card.id}
                      className="border rounded-lg p-4 bg-white hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{card.title}</h4>
                          <p className="text-sm text-neutral-500">
                            Coluna: {card.column.title}
                          </p>
                          {card.assignees && card.assignees.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {card.assignees.map((assignee) => (
                                <div
                                  key={assignee.user.id}
                                  className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs"
                                >
                                  <span className="font-medium">👤</span>
                                  <span>{assignee.user.name || assignee.user.email}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-neutral-600">
                          {cardDoneItems}/{cardTotalItems} tarefas
                        </span>
                      </div>

                      {card.checklists.length > 0 && (
                        <>
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${cardProgress}%` }}
                            />
                          </div>

                          <div className="space-y-2">
                            {card.checklists.map((checklist) => (
                              <div key={checklist.id}>
                                <p className="text-sm font-medium text-neutral-700 mb-1">
                                  {checklist.title}
                                </p>
                                <div className="space-y-1 pl-2">
                                  {checklist.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <span
                                        className={`inline-block w-3 h-3 rounded border ${
                                          item.done
                                            ? "bg-green-500 border-green-500"
                                            : "border-neutral-300"
                                        }`}
                                      >
                                        {item.done && (
                                          <span className="text-white text-[10px] leading-none flex items-center justify-center h-full">
                                            ✓
                                          </span>
                                        )}
                                      </span>
                                      <span
                                        className={
                                          item.done
                                            ? "line-through text-neutral-400"
                                            : "text-neutral-600"
                                        }
                                      >
                                        {item.content}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Histórico de Atividades */}
          <div>
            <h3 className="font-semibold mb-3">Histórico de Atividades</h3>
            {loadingActivities ? (
              <div className="text-center py-8 text-neutral-500">
                Carregando atividades...
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">
                Nenhuma atividade registrada
              </p>
            ) : (
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-[15px] top-[10px] bottom-[10px] w-[2px] bg-neutral-200" />

                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3 relative">
                      {/* Icon container */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${getActivityColor(
                          activity.type
                        )}`}
                      >
                        <span className="text-base">
                          {getActivityIcon(activity.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <p className="text-sm text-neutral-700 font-medium">
                          {activity.message}
                        </p>
                        {activity.metadata && (
                          <div className="mt-1 text-xs text-neutral-500">
                            {activity.metadata.cardTitle && (
                              <span className="block">
                                Card: {activity.metadata.cardTitle}
                              </span>
                            )}
                            {activity.metadata.fromColumn &&
                              activity.metadata.toColumn && (
                                <span className="block">
                                  {activity.metadata.fromColumn} → {activity.metadata.toColumn}
                                </span>
                              )}
                          </div>
                        )}
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
