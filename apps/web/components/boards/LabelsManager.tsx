"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Label {
  id: string;
  name: string;
  color: string;
  order: number;
  _count?: {
    cards: number;
  };
}

interface CardLabel {
  label: Label;
}

const PRESET_COLORS = [
  { value: "#ef4444", name: "Vermelho" },
  { value: "#f97316", name: "Laranja" },
  { value: "#eab308", name: "Amarelo" },
  { value: "#22c55e", name: "Verde" },
  { value: "#3b82f6", name: "Azul" },
  { value: "#8b5cf6", name: "Roxo" },
  { value: "#ec4899", name: "Rosa" },
  { value: "#64748b", name: "Cinza" },
];

export function LabelsManager({
  cardId,
  boardId,
  currentLabels = [],
  onUpdate,
}: {
  cardId: string;
  boardId: string;
  currentLabels?: CardLabel[];
  onUpdate?: () => void;
}) {
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadBoardLabels();
    checkUserRole();
  }, [boardId]);

  async function checkUserRole() {
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.userRole === "ADMIN" || data.userRole === "OWNER");
      }
    } catch (err) {
      console.error("Check role error:", err);
    }
  }

  async function loadBoardLabels() {
    try {
      const res = await fetch(`/api/boards/${boardId}/labels`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBoardLabels(data);
      }
    } catch (err) {
      console.error("Load labels error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createLabel() {
    if (!newLabelName.trim()) {
      toast.error("Nome da label é obrigatório");
      return;
    }

    try {
      const res = await fetch(`/api/boards/${boardId}/labels`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: selectedColor,
        }),
      });

      if (res.ok) {
        toast.success("Label criada com sucesso!");
        setCreateDialogOpen(false);
        setNewLabelName("");
        setSelectedColor(PRESET_COLORS[0].value);
        loadBoardLabels();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao criar label");
      }
    } catch (err) {
      console.error("Create label error:", err);
      toast.error("Erro ao criar label");
    }
  }

  async function updateLabel() {
    if (!editingLabel || !newLabelName.trim()) return;

    try {
      const res = await fetch(
        `/api/boards/${boardId}/labels/${editingLabel.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newLabelName.trim(),
            color: selectedColor,
          }),
        }
      );

      if (res.ok) {
        toast.success("Label atualizada!");
        setEditingLabel(null);
        setNewLabelName("");
        setSelectedColor(PRESET_COLORS[0].value);
        loadBoardLabels();
        onUpdate?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao atualizar label");
      }
    } catch (err) {
      console.error("Update label error:", err);
      toast.error("Erro ao atualizar label");
    }
  }

  async function deleteLabel(labelId: string) {
    if (!confirm("Tem certeza que deseja deletar esta label?")) return;

    try {
      const res = await fetch(`/api/boards/${boardId}/labels/${labelId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Label deletada!");
        loadBoardLabels();
        onUpdate?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao deletar label");
      }
    } catch (err) {
      console.error("Delete label error:", err);
      toast.error("Erro ao deletar label");
    }
  }

  async function toggleCardLabel(labelId: string) {
    const hasLabel = currentLabels.some((cl) => cl.label.id === labelId);

    try {
      if (hasLabel) {
        const res = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/labels?labelId=${labelId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (res.ok) {
          toast.success("Label removida do card");
          onUpdate?.();
        } else {
          const data = await res.json();
          toast.error(data.error || "Erro ao remover label");
        }
      } else {
        const res = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/labels`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ labelId }),
          }
        );

        if (res.ok) {
          toast.success("Label adicionada ao card");
          onUpdate?.();
        } else {
          const data = await res.json();
          toast.error(data.error || "Erro ao adicionar label");
        }
      }
    } catch (err) {
      console.error("Toggle label error:", err);
      toast.error("Erro ao atualizar label");
    }
  }

  function openEditDialog(label: Label) {
    setEditingLabel(label);
    setNewLabelName(label.name);
    setSelectedColor(label.color);
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando labels...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Tags</h4>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            + Nova Tag
          </Button>
        )}
      </div>

      {/* Current Card Labels */}
      {currentLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentLabels.map(({ label }) => (
            <Badge
              key={label.id}
              className="h-8 px-3 text-white cursor-pointer hover:opacity-80"
              style={{ backgroundColor: label.color }}
              onClick={() => toggleCardLabel(label.id)}
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Available Labels */}
      <div>
        <p className="text-sm text-neutral-600 mb-2">
          {currentLabels.length > 0 ? "Adicionar/remover tags:" : "Adicionar tags:"}
        </p>
        <div className="space-y-2">
          {boardLabels.length === 0 ? (
            <p className="text-sm text-neutral-500 italic">
              Nenhuma tag disponível. {isAdmin && "Crie uma nova tag acima."}
            </p>
          ) : (
            boardLabels.map((label) => {
              const isActive = currentLabels.some((cl) => cl.label.id === label.id);
              return (
                <div
                  key={label.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleCardLabel(label.id)}
                    className="w-4 h-4 rounded border-neutral-300"
                  />
                  <Badge
                    className="h-8 px-3 text-white flex-1 cursor-pointer"
                    style={{ backgroundColor: label.color }}
                    onClick={() => toggleCardLabel(label.id)}
                  >
                    {label.name}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(label)}
                        className="h-7 px-2 text-xs"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLabel(label.id)}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Deletar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Label Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome</label>
              <Input
                placeholder="Ex: Urgente, Bug, Feature..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createLabel();
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-12 rounded-lg border-2 transition ${
                      selectedColor === color.value
                        ? "border-neutral-900 scale-105"
                        : "border-transparent hover:border-neutral-300"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-neutral-600">Preview:</p>
              <Badge
                className="h-8 px-3 text-white mt-2"
                style={{ backgroundColor: selectedColor }}
              >
                {newLabelName.trim() || "Nome da tag"}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createLabel}>Criar Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Label Dialog */}
      <Dialog
        open={editingLabel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLabel(null);
            setNewLabelName("");
            setSelectedColor(PRESET_COLORS[0].value);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome</label>
              <Input
                placeholder="Nome da tag"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateLabel();
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-12 rounded-lg border-2 transition ${
                      selectedColor === color.value
                        ? "border-neutral-900 scale-105"
                        : "border-transparent hover:border-neutral-300"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-neutral-600">Preview:</p>
              <Badge
                className="h-8 px-3 text-white mt-2"
                style={{ backgroundColor: selectedColor }}
              >
                {newLabelName.trim() || "Nome da tag"}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingLabel(null);
                setNewLabelName("");
                setSelectedColor(PRESET_COLORS[0].value);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={updateLabel}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
