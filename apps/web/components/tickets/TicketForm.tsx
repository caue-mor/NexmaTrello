"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TicketFormProps {
    boardId?: string; // Made boardId optional
    onSuccess: () => void;
    onCancel: () => void;
}

export function TicketForm({ boardId, onSuccess, onCancel }: TicketFormProps) { // Updated type to use TicketFormProps
    const [loading, setLoading] = useState(false);
    const [boards, setBoards] = useState<{ id: string; title: string }[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState(boardId || "");
    const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
    const [assigneeInput, setAssigneeInput] = useState("");
    const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "TASK",
        priority: "MEDIUM",
        dueDate: "",
        estimatedHours: "",
    });

    // Carregar boards se não houver boardId pré-selecionado
    useEffect(() => {
        if (!boardId) {
            fetch("/api/boards")
                .then((res) => res.json())
                .then((data) => {
                    if (data.boards) setBoards(data.boards);
                })
                .catch((err) => console.error("Erro ao carregar boards:", err));
        }
    }, [boardId]);

    // Carregar usuários disponíveis quando board for selecionado
    useEffect(() => {
        if (selectedBoardId) {
            fetch(`/api/users/available?boardId=${selectedBoardId}&onlyMembers=true`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.users) setAvailableUsers(data.users);
                })
                .catch((err) => console.error("Erro ao carregar usuários:", err));
        }
    }, [selectedBoardId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedBoardId) { // Added check for selectedBoardId
            toast.error("Selecione um board");
            return;
        }
        setLoading(true);

        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    boardId: selectedBoardId,
                    assignedToId: selectedAssigneeId,
                    estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Ticket criado com sucesso!");
                onSuccess();
            } else {
                toast.error(data.error || "Erro ao criar ticket");
            }
        } catch (err) {
            toast.error("Erro de conexão");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold">Novo Ticket</h2>
                <button type="button" onClick={onCancel} className="text-neutral-500 hover:text-neutral-900">
                    ✕
                </button>
            </div>

            <div className="space-y-4">
                {/* Seletor de Board se não houver boardId fixo */}
                {!boardId && (
                    <div className="space-y-2">
                        <Label htmlFor="board">Board</Label>
                        <Select
                            value={selectedBoardId}
                            onValueChange={setSelectedBoardId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um board" />
                            </SelectTrigger>
                            <SelectContent>
                                {boards.map((board) => (
                                    <SelectItem key={board.id} value={board.id}>
                                        {board.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="title">Título (Obrigatório)</Label>
                    <Input
                        id="title"
                        required
                        placeholder="Ex: Corrigir erro no login"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BUG">🐛 Bug / Erro</SelectItem>
                                <SelectItem value="FEATURE">✨ Nova Funcionalidade</SelectItem>
                                <SelectItem value="TASK">📋 Tarefa</SelectItem>
                                <SelectItem value="SUPPORT">🆘 Suporte</SelectItem>
                                <SelectItem value="URGENT">🔥 Urgente / Emergência</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Prioridade</Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(val) => setFormData({ ...formData, priority: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Baixa</SelectItem>
                                <SelectItem value="MEDIUM">Média</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="URGENT">Urgente</SelectItem>
                                <SelectItem value="CRITICAL">Crítica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Seletor de Responsável */}
                <div className="space-y-2">
                    <Label htmlFor="assignee">Atribuir para (Responsável)</Label>
                    <div className="relative">
                        <Input
                            id="assignee"
                            placeholder="Digite o nome ou email do responsável..."
                            value={assigneeInput}
                            onChange={(e) => {
                                setAssigneeInput(e.target.value);
                                setShowAssigneeSuggestions(e.target.value.trim().length > 0);
                            }}
                            onFocus={() => {
                                if (assigneeInput.trim().length > 0) {
                                    setShowAssigneeSuggestions(true);
                                }
                            }}
                            disabled={!selectedBoardId}
                            autoComplete="off"
                        />

                        {/* Dropdown de sugestões */}
                        {showAssigneeSuggestions && availableUsers.filter(u => {
                            const term = assigneeInput.toLowerCase();
                            return (u.name || "").toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
                        }).length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                    {availableUsers
                                        .filter(u => {
                                            const term = assigneeInput.toLowerCase();
                                            return (u.name || "").toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
                                        })
                                        .map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAssigneeId(user.id);
                                                    setAssigneeInput(user.name || user.email);
                                                    setShowAssigneeSuggestions(false);
                                                }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition text-left border-b border-neutral-100 last:border-b-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-medium">
                                                    {(user.name || user.email)[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {user.name || user.email}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            )}

                        {selectedAssigneeId && (
                            <p className="text-xs text-green-600 mt-1">
                                ✓ Responsável selecionado
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição / Motivo</Label>
                    <Textarea
                        id="description"
                        placeholder="Descreva detalhadamente o problema ou solicitação..."
                        className="h-32"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Prazo (Opcional)</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                        <Input
                            id="estimatedHours"
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Ex: 2.5"
                            value={formData.estimatedHours}
                            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading || !formData.title}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Criar Ticket
                </Button>
            </div>
        </form>
    );
}
