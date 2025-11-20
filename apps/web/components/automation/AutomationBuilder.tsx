"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Column {
    id: string;
    title: string;
}

interface AutomationBuilderProps {
    boardId: string;
    onSave: () => void;
    onCancel: () => void;
}

export function AutomationBuilder({ boardId, onSave, onCancel }: AutomationBuilderProps) {
    const [name, setName] = useState("");
    const [triggerType, setTriggerType] = useState("CARD_MOVED");
    const [actionType, setActionType] = useState("MOVE_CARD");
    const [columns, setColumns] = useState<Column[]>([]);

    // Trigger Config
    const [fromColumnId, setFromColumnId] = useState<string>("any");
    const [toColumnId, setToColumnId] = useState<string>("any");

    // Action Config
    const [targetColumnId, setTargetColumnId] = useState<string>("");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch columns for selection
        fetch(`/api/boards/${boardId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.board && data.board.columns) {
                    setColumns(data.board.columns);
                }
            });
    }, [boardId]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Nome da automação é obrigatório");
            return;
        }
        if (actionType === "MOVE_CARD" && !targetColumnId) {
            toast.error("Selecione uma coluna de destino");
            return;
        }

        setLoading(true);
        try {
            const triggerConfig: any = {};
            if (triggerType === "CARD_MOVED") {
                if (fromColumnId !== "any") triggerConfig.fromColumnId = fromColumnId;
                if (toColumnId !== "any") triggerConfig.toColumnId = toColumnId;
            }

            const actionConfig: any = {};
            if (actionType === "MOVE_CARD") {
                actionConfig.targetColumnId = targetColumnId;
            } else if (actionType === "MARK_COMPLETE") {
                // No config needed or maybe target column
                if (targetColumnId) actionConfig.targetColumnId = targetColumnId;
            }

            const res = await fetch(`/api/boards/${boardId}/automations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    triggerType,
                    triggerConfig,
                    actionType,
                    actionConfig,
                }),
            });

            if (!res.ok) throw new Error("Failed to save automation");

            toast.success("Automação criada com sucesso!");
            onSave();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar automação");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-4 border rounded-lg bg-neutral-50">
            <div className="space-y-2">
                <Label>Nome da Automação</Label>
                <Input
                    placeholder="Ex: Mover para Done quando finalizado"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-start">
                {/* Trigger Section */}
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <h3 className="font-medium text-sm text-neutral-500 uppercase">Quando...</h3>

                        <Select value={triggerType} onValueChange={setTriggerType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CARD_MOVED">Card for movido</SelectItem>
                                <SelectItem value="CARD_CREATED">Card for criado</SelectItem>
                            </SelectContent>
                        </Select>

                        {triggerType === "CARD_MOVED" && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">De</Label>
                                    <Select value={fromColumnId} onValueChange={setFromColumnId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Qualquer coluna" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Qualquer coluna</SelectItem>
                                            {columns.map((col) => (
                                                <SelectItem key={col.id} value={col.id}>
                                                    {col.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Para</Label>
                                    <Select value={toColumnId} onValueChange={setToColumnId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Qualquer coluna" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Qualquer coluna</SelectItem>
                                            {columns.map((col) => (
                                                <SelectItem key={col.id} value={col.id}>
                                                    {col.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-center pt-10 text-neutral-400">
                    <ArrowRight className="w-6 h-6" />
                </div>

                {/* Action Section */}
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <h3 className="font-medium text-sm text-neutral-500 uppercase">Então...</h3>

                        <Select value={actionType} onValueChange={setActionType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MOVE_CARD">Mover card para</SelectItem>
                                <SelectItem value="MARK_COMPLETE">Marcar como concluído</SelectItem>
                            </SelectContent>
                        </Select>

                        {(actionType === "MOVE_CARD" || actionType === "MARK_COMPLETE") && (
                            <div className="space-y-1">
                                <Label className="text-xs">Coluna de Destino</Label>
                                <Select value={targetColumnId} onValueChange={setTargetColumnId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columns.map((col) => (
                                            <SelectItem key={col.id} value={col.id}>
                                                {col.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {actionType === "MARK_COMPLETE" && (
                                    <p className="text-[10px] text-neutral-500">
                                        Opcional: Mover card ao concluir
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Automação
                </Button>
            </div>
        </div>
    );
}
