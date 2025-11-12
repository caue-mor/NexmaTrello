"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { CreateCardDialog } from "./CreateCardDialog";
import { CardModal } from "./CardModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface CardLabel {
  label: Label;
}

interface Card {
  id: string;
  title: string;
  description: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt: Date | string | null;
  client?: {
    id: string;
    name: string;
    status: string;
  } | null;
  labels?: CardLabel[];
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
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

function getDueDateStatus(dueAt: Date | string | null) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';        // Vencido
  if (diffDays === 0) return 'due-today';    // Vence hoje
  if (diffDays <= 2) return 'due-soon';      // Vence em 2 dias
  return 'ok';
}

// Função para calcular prioridade do card (maior = mais urgente)
function getCardPriority(card: Card): number {
  // Peso da urgência
  const urgencyWeight = {
    CRITICAL: 4000,
    HIGH: 3000,
    MEDIUM: 2000,
    LOW: 1000,
  };

  // Peso do status de vencimento
  const dueDateStatus = getDueDateStatus(card.dueAt);
  const dueDateWeight = {
    overdue: 400,
    'due-today': 300,
    'due-soon': 200,
  };

  let priority = urgencyWeight[card.urgency] || 0;

  if (dueDateStatus && dueDateWeight[dueDateStatus as keyof typeof dueDateWeight]) {
    priority += dueDateWeight[dueDateStatus as keyof typeof dueDateWeight];
  }

  // Se tem prazo, adiciona peso extra baseado em quão próximo está
  if (card.dueAt) {
    const due = new Date(card.dueAt);
    const now = new Date();
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Quanto menor o número de dias, maior a prioridade (inversamente proporcional)
    if (daysUntil < 0) {
      priority += Math.abs(daysUntil) * 10; // Muito atrasado = muito urgente
    } else if (daysUntil <= 7) {
      priority += (7 - daysUntil) * 5; // Vence em breve
    }
  }

  return priority;
}

// Função para ordenar cards por prioridade
function sortCardsByPriority(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const priorityA = getCardPriority(a);
    const priorityB = getCardPriority(b);
    return priorityB - priorityA; // Maior prioridade primeiro
  });
}

// Função para obter classes de borda baseadas na urgência
function getUrgencyBorderClass(urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"): string {
  const borderClasses = {
    CRITICAL: "border-l-4 border-l-red-600",
    HIGH: "border-l-4 border-l-orange-500",
    MEDIUM: "border-l-4 border-l-yellow-500",
    LOW: "border-l-4 border-l-blue-500",
  };
  return borderClasses[urgency] || "";
}

export function DraggableBoard({
  boardId,
  initialColumns,
}: {
  boardId: string;
  initialColumns: Column[];
}) {
  // Ordena os cards inicialmente por prioridade
  const sortedInitialColumns = initialColumns.map((col) => ({
    ...col,
    cards: sortCardsByPriority(col.cards),
  }));

  const [columns, setColumns] = useState(sortedInitialColumns);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [deleteColumnDialog, setDeleteColumnDialog] = useState<{
    open: boolean;
    columnId: string | null;
    columnTitle: string | null;
  }>({
    open: false,
    columnId: null,
    columnTitle: null,
  });

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;

    // Moving within the same column
    if (sourceColumnId === destColumnId) {
      const column = columns.find((col) => col.id === sourceColumnId);
      if (!column) return;

      const newCards = Array.from(column.cards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);

      setColumns(
        columns.map((col) =>
          col.id === sourceColumnId ? { ...col, cards: newCards } : col
        )
      );
    } else {
      // Moving to different column
      const sourceColumn = columns.find((col) => col.id === sourceColumnId);
      const destColumn = columns.find((col) => col.id === destColumnId);

      if (!sourceColumn || !destColumn) return;

      const sourceCards = Array.from(sourceColumn.cards);
      const destCards = Array.from(destColumn.cards);
      const [removed] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, removed);

      setColumns(
        columns.map((col) => {
          if (col.id === sourceColumnId) return { ...col, cards: sourceCards };
          if (col.id === destColumnId) return { ...col, cards: destCards };
          return col;
        })
      );

      // Update card on server
      try {
        await fetch(`/api/boards/${boardId}/cards/${draggableId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ columnId: destColumnId }),
        });
      } catch (err) {
        console.error("Move card error:", err);
        // Revert on error
        setColumns(initialColumns);
      }
    }
  }

  function openDeleteColumnDialog(columnId: string, columnTitle: string) {
    setDeleteColumnDialog({
      open: true,
      columnId,
      columnTitle,
    });
  }

  async function confirmDeleteColumn() {
    if (!deleteColumnDialog.columnId) return;

    try {
      const response = await fetch(`/api/boards/${boardId}/columns/${deleteColumnDialog.columnId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Erro ao excluir coluna");
        return;
      }

      // Remove column from state
      setColumns(columns.filter((col) => col.id !== deleteColumnDialog.columnId));

      // Close dialog
      setDeleteColumnDialog({ open: false, columnId: null, columnTitle: null });

      toast.success("Coluna excluída com sucesso");

      // Reload page to sync with server
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Delete column error:", err);
      toast.error("Erro ao excluir coluna");
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-neutral-100 rounded-xl p-4"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900">{column.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500">
                    {column.cards.length}
                  </span>
                  {column.cards.length === 0 && (
                    <button
                      onClick={() => openDeleteColumnDialog(column.id, column.title)}
                      className="p-1 hover:bg-red-100 rounded text-red-600 transition"
                      title="Excluir coluna vazia"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Droppable Cards Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] ${
                      snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-2" : ""
                    }`}
                  >
                    {column.cards.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="text-center py-8 text-sm text-neutral-500">
                        Nenhum card
                      </div>
                    ) : (
                      column.cards.map((card, index) => {
                        const totalItems = card.checklists.reduce(
                          (acc, cl) => acc + cl.items.length,
                          0
                        );
                        const doneItems = card.checklists.reduce(
                          (acc, cl) => acc + cl.items.filter((i) => i.done).length,
                          0
                        );
                        const progress =
                          totalItems > 0
                            ? Math.round((doneItems / totalItems) * 100)
                            : 0;

                        return (
                          <Draggable
                            key={card.id}
                            draggableId={card.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer ${
                                  snapshot.isDragging ? "shadow-lg rotate-2" : ""
                                } ${getUrgencyBorderClass(card.urgency)}`}
                                onClick={() => setSelectedCard(card.id)}
                              >
                                <h4 className="font-medium mb-2">{card.title}</h4>

                                {card.description && (
                                  <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                                    {card.description}
                                  </p>
                                )}

                                {/* Cliente */}
                                {card.client && (
                                  <div className="mb-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                      🏢 {card.client.name}
                                    </span>
                                  </div>
                                )}

                                {/* Labels/Tags */}
                                {card.labels && card.labels.length > 0 && (
                                  <div className="mb-2 flex flex-wrap gap-1">
                                    {card.labels.map(({ label }) => (
                                      <span
                                        key={label.id}
                                        className="inline-flex items-center justify-center h-6 px-2 rounded text-white text-xs font-medium"
                                        style={{ backgroundColor: label.color }}
                                        title={label.name}
                                      >
                                        {label.name.length > 12
                                          ? label.name.substring(0, 12) + '...'
                                          : label.name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Pessoas Atribuídas */}
                                {card.assignees.length > 0 && (
                                  <div className="mb-2 flex flex-wrap gap-1">
                                    {card.assignees.map((assignee) => (
                                      <span
                                        key={assignee.user.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                                        title={assignee.user.email}
                                      >
                                        👤 {assignee.user.name || assignee.user.email.split('@')[0]}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Card Metadata */}
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  {card.urgency !== "MEDIUM" && (() => {
                                    const urgencyLabels = {
                                      LOW: "Baixa",
                                      MEDIUM: "Média",
                                      HIGH: "Alta",
                                      CRITICAL: "Crítica"
                                    };
                                    return (
                                      <span
                                        className={`px-2 py-1 rounded ${
                                          card.urgency === "CRITICAL"
                                            ? "bg-red-100 text-red-700"
                                            : card.urgency === "HIGH"
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-blue-100 text-blue-700"
                                        }`}
                                      >
                                        {urgencyLabels[card.urgency]}
                                      </span>
                                    );
                                  })()}

                                  {/* Due Date Badge */}
                                  {card.dueAt && (() => {
                                    const status = getDueDateStatus(card.dueAt);
                                    const dueDate = new Date(card.dueAt);
                                    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit'
                                    }).format(dueDate);

                                    if (status === 'overdue') {
                                      return (
                                        <span className="px-2 py-1 rounded bg-red-500 text-white font-medium">
                                          ⏰ ATRASADO ({formattedDate})
                                        </span>
                                      );
                                    }
                                    if (status === 'due-today') {
                                      return (
                                        <span className="px-2 py-1 rounded bg-orange-500 text-white font-medium">
                                          📅 HOJE ({formattedDate})
                                        </span>
                                      );
                                    }
                                    if (status === 'due-soon') {
                                      return (
                                        <span className="px-2 py-1 rounded bg-yellow-500 text-white font-medium">
                                          ⏳ 2 dias ({formattedDate})
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                                        📅 {formattedDate}
                                      </span>
                                    );
                                  })()}

                                  {totalItems > 0 && (
                                    <span className="flex items-center gap-1">
                                      ✓ {doneItems}/{totalItems}
                                    </span>
                                  )}
                                </div>

                                {/* Progress Bar */}
                                {totalItems > 0 && (
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                                      <span>Progresso</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-green-500 transition-all"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Checklist Preview */}
                                {card.checklists.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {card.checklists.slice(0, 2).map((checklist) => (
                                      <div key={checklist.id}>
                                        <p className="text-xs font-medium text-neutral-700 mb-1">
                                          {checklist.title}
                                        </p>
                                        <div className="space-y-0.5">
                                          {checklist.items.slice(0, 3).map((item) => (
                                            <div
                                              key={item.id}
                                              className="flex items-center gap-1 text-xs"
                                            >
                                              <span
                                                className={`inline-block w-3 h-3 rounded border flex-shrink-0 ${
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
                                                className={`truncate ${
                                                  item.done
                                                    ? "line-through text-neutral-400"
                                                    : "text-neutral-600"
                                                }`}
                                              >
                                                {item.content}
                                              </span>
                                            </div>
                                          ))}
                                          {checklist.items.length > 3 && (
                                            <p className="text-xs text-neutral-400 pl-4">
                                              +{checklist.items.length - 3} mais...
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {card.checklists.length > 2 && (
                                      <p className="text-xs text-neutral-400 font-medium">
                                        +{card.checklists.length - 2} checklist(s)...
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add Card Button */}
              <CreateCardDialog boardId={boardId} columnId={column.id} />
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedCard && (
        <CardModal
          cardId={selectedCard}
          boardId={boardId}
          onClose={() => {
            setSelectedCard(null);
            // Recarregar página para mostrar mudanças (card movido para Finalizado)
            window.location.reload();
          }}
        />
      )}

      {/* Dialog de confirmação para excluir coluna */}
      <ConfirmDialog
        open={deleteColumnDialog.open}
        onClose={() => setDeleteColumnDialog({ open: false, columnId: null, columnTitle: null })}
        onConfirm={confirmDeleteColumn}
        title="Excluir coluna?"
        description={`Tem certeza que deseja excluir a coluna "${deleteColumnDialog.columnTitle}"? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
      />
    </>
  );
}