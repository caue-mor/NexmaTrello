"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardPerformance } from "./CardPerformance";
import { AssigneeSelector } from "./AssigneeSelector";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  content: string;
  done: boolean;
  doneAt: string | null;
}

interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Card {
  id: string;
  title: string;
  description: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  checklists: Checklist[];
  comments?: Comment[];
  assignees?: {
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }[];
  createdBy: {
    name: string | null;
    email: string;
  };
}

export function CardModal({
  cardId,
  boardId,
  onClose,
}: {
  cardId: string;
  boardId: string;
  onClose: () => void;
}) {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemContent, setNewItemContent] = useState<{ [key: string]: string }>({});
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    loadCard();
  }, [cardId]);

  async function loadCard() {
    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setCard(data.card);
      }
    } catch (err) {
      console.error("Load card error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/checklists`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newChecklistTitle }),
      });

      if (res.ok) {
        setNewChecklistTitle("");
        loadCard();
      }
    } catch (err) {
      console.error("Add checklist error:", err);
    }
  }

  async function addItem(checklistId: string) {
    const content = newItemContent[checklistId];
    if (!content?.trim()) return;

    try {
      const res = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (res.ok) {
        setNewItemContent({ ...newItemContent, [checklistId]: "" });
        loadCard();
      }
    } catch (err) {
      console.error("Add item error:", err);
    }
  }

  async function toggleItem(itemId: string, done: boolean) {
    try {
      const res = await fetch(`/api/checklist-items/${itemId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !done }),
      });

      if (res.ok) {
        loadCard();
      }
    } catch (err) {
      console.error("Toggle item error:", err);
    }
  }

  async function deleteCard() {
    if (!confirm("Tem certeza que deseja deletar este card?")) return;

    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Card deletado com sucesso!");
        window.location.reload();
      } else {
        const data = await res.json();

        if (res.status === 403) {
          // Permissão negada - mostrar toast bonito com informação do dono do board
          toast.error(data.error, {
            description: data.boardOwner
              ? `Somente ${data.boardOwner} (dono do board) pode deletar cards`
              : "Você não tem permissão para deletar este card",
            duration: 5000,
          });
        } else {
          toast.error(data.error || "Erro ao deletar card");
        }
      }
    } catch (err) {
      console.error("Delete card error:", err);
      toast.error("Erro de conexão ao deletar card");
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment("");
        loadCard();
      }
    } catch (err) {
      console.error("Add comment error:", err);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-3xl">
          <p className="text-center">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const totalItems = card.checklists.reduce((acc, cl) => acc + cl.items.length, 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{card.title}</h2>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  card.urgency === "CRITICAL"
                    ? "bg-red-100 text-red-700"
                    : card.urgency === "HIGH"
                    ? "bg-orange-100 text-orange-700"
                    : card.urgency === "MEDIUM"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {card.urgency}
              </span>
              <span>Por {card.createdBy.name || card.createdBy.email}</span>
              {card.dueAt && (
                <span>
                  Vence: {new Date(card.dueAt).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Description */}
        {card.description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-neutral-700 whitespace-pre-wrap">
              {card.description}
            </p>
          </div>
        )}

        {/* Performance */}
        {totalItems > 0 && (
          <div className="mb-6">
            <CardPerformance card={card} variant="detailed" />
          </div>
        )}

        {/* Assignees */}
        <div className="mb-6 border border-neutral-200 rounded-xl p-4">
          <AssigneeSelector
            cardId={cardId}
            boardId={boardId}
            currentAssignees={(card.assignees || []).map((a) => a.user)}
            onUpdate={loadCard}
          />
        </div>

        {/* Checklists */}
        <div className="space-y-6 mb-6">
          {card.checklists.map((checklist) => {
            const clDone = checklist.items.filter((i) => i.done).length;
            const clTotal = checklist.items.length;
            const clProgress = clTotal > 0 ? Math.round((clDone / clTotal) * 100) : 0;

            return (
              <div key={checklist.id} className="border border-neutral-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{checklist.title}</h4>
                  <span className="text-sm text-neutral-600">
                    {clDone}/{clTotal}
                  </span>
                </div>

                {clTotal > 0 && (
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${clProgress}%` }}
                    />
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  {checklist.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleItem(item.id, item.done)}
                        className="w-4 h-4 rounded border-neutral-300"
                      />
                      <span
                        className={`flex-1 ${
                          item.done ? "line-through text-neutral-500" : ""
                        }`}
                      >
                        {item.content}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add Item */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addItem(checklist.id);
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Adicionar item..."
                    value={newItemContent[checklist.id] || ""}
                    onChange={(e) =>
                      setNewItemContent({
                        ...newItemContent,
                        [checklist.id]: e.target.value,
                      })
                    }
                  />
                  <Button type="submit" size="sm">
                    +
                  </Button>
                </form>
              </div>
            );
          })}
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Comentários</h3>
          <div className="space-y-3 mb-4">
            {card.comments && card.comments.length > 0 ? (
              card.comments.map((comment) => (
                <div key={comment.id} className="border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {(comment.user.name || comment.user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {comment.user.name || comment.user.email}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(comment.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-neutral-500">
                Nenhum comentário ainda
              </p>
            )}
          </div>

          <form onSubmit={addComment} className="flex gap-2">
            <Input
              placeholder="Adicionar comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button type="submit">Enviar</Button>
          </form>
        </div>

        {/* Add Checklist */}
        <form onSubmit={addChecklist} className="mb-6">
          <h4 className="font-semibold mb-2">Nova Checklist</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da checklist..."
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
            />
            <Button type="submit">Adicionar</Button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-neutral-200">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="destructive" onClick={deleteCard}>
            Deletar Card
          </Button>
        </div>
      </div>
    </div>
  );
}