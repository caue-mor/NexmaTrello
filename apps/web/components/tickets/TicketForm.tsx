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
    const [boards, setBoards] = useState<{ id: string; title: string }[]>([]); // Added boards state
    const [selectedBoardId, setSelectedBoardId] = useState(boardId || ""); // Added selectedBoardId state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "TASK",
        priority: "MEDIUM",
        dueDate: "",
        estimatedHours: "",
    });

    // Carregar boards se não houver boardId pré-selecionado
    useEffect(() => { // Changed from useState to useEffect
        if (!boardId) {
            fetch("/api/boards")
                .then((res) => res.json())
                .then((data) => {
                    if (data.boards) setBoards(data.boards);
                })
                .catch((err) => console.error("Erro ao carregar boards:", err));
        }
    }, [boardId]); // Dependency array for useEffect

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
                    boardId: selectedBoardId, // Used selectedBoardId
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

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                        id="description"
                        placeholder="Descreva detalhadamente o que precisa ser feito..."
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
