"use client";

import { useState } from "react";
import { CreateCardDialog } from "./CreateCardDialog";
import { CardModal } from "./CardModal";

interface Card {
  id: string;
  title: string;
  description: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt: Date | string | null;
  checklists: {
    items: { done: boolean }[];
  }[];
  assignees: any[];
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export function BoardClient({
  boardId,
  columns,
}: {
  boardId: string;
  columns: Column[];
}) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-neutral-100 rounded-xl p-4"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">{column.title}</h3>
              <span className="text-sm text-neutral-500">
                {column.cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {column.cards.length === 0 ? (
                <div className="text-center py-8 text-sm text-neutral-500">
                  Nenhum card
                </div>
              ) : (
                column.cards.map((card) => {
                  const totalItems = card.checklists.reduce(
                    (acc, cl) => acc + cl.items.length,
                    0
                  );
                  const doneItems = card.checklists.reduce(
                    (acc, cl) => acc + cl.items.filter((i) => i.done).length,
                    0
                  );
                  const progress =
                    totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

                  return (
                    <div
                      key={card.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                      onClick={() => setSelectedCard(card.id)}
                    >
                      <h4 className="font-medium mb-2">{card.title}</h4>

                      {card.description && (
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                          {card.description}
                        </p>
                      )}

                      {/* Card Metadata */}
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        {card.urgency !== "MEDIUM" && (
                          <span
                            className={`px-2 py-1 rounded ${
                              card.urgency === "CRITICAL"
                                ? "bg-red-100 text-red-700"
                                : card.urgency === "HIGH"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {card.urgency}
                          </span>
                        )}

                        {totalItems > 0 && (
                          <span className="flex items-center gap-1">
                            ✓ {doneItems}/{totalItems}
                          </span>
                        )}

                        {card.assignees.length > 0 && (
                          <span>👤 {card.assignees.length}</span>
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
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Card Button */}
            <CreateCardDialog boardId={boardId} columnId={column.id} />
          </div>
        ))}
      </div>

      {selectedCard && (
        <CardModal
          cardId={selectedCard}
          boardId={boardId}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}